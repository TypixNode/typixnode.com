// Scheduled D1 -> R2 backup.
//
// Each cron tick: for every target database, call the D1 REST export API
// (polling mode), wait for the signed_url, stream the SQL dump into the R2
// bucket, then prune backups older than RETENTION_DAYS.
//
// Why a scheduled handler instead of the Workflows example: a plain cron
// Worker works on every plan, needs no Workflows beta, and the export job is
// short. We implement our own bounded polling + retry.

interface Env {
  BACKUP_BUCKET: R2Bucket;
  ACCOUNT_ID: string;
  D1_TARGETS: string; // "label:dbid,label:dbid"
  RETENTION_DAYS: string;
  D1_REST_API_TOKEN: string; // secret
}

const API = 'https://api.cloudflare.com/client/v4';

function parseTargets(s: string): Array<{ label: string; dbId: string }> {
  return (s || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [label, dbId] = p.split(':');
      return { label: label?.trim(), dbId: dbId?.trim() };
    })
    .filter((t) => t.label && t.dbId);
}

async function d1ExportCall(env: Env, dbId: string, body: object): Promise<any> {
  const res = await fetch(`${API}/accounts/${env.ACCOUNT_ID}/d1/database/${dbId}/export`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.D1_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as any;
  if (!json.success) {
    throw new Error(`D1 export API error: ${JSON.stringify(json.errors)}`);
  }
  return json.result;
}

/**
 * Run a full export for one database and return the signed download URL.
 * Polling protocol (per D1 export REST API):
 *  - first call: { output_format: 'polling' } -> returns result.at_bookmark
 *  - poll: { output_format: 'polling', current_bookmark: <at_bookmark> }
 *  - when status === 'complete', the URL is at result.result.signed_url
 * An in-progress export must be polled continually or it auto-cancels.
 */
async function exportDatabase(env: Env, dbId: string): Promise<string> {
  const first = await d1ExportCall(env, dbId, { output_format: 'polling' });
  const bookmark: string | undefined = first.at_bookmark;
  if (first?.result?.signed_url) return first.result.signed_url;

  // Bounded poll — ~40 tries * 3s ≈ 2 min.
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await d1ExportCall(env, dbId, {
      output_format: 'polling',
      current_bookmark: bookmark,
    });
    if (res?.status === 'error') {
      throw new Error(`D1 export error: ${res.error || 'unknown'}`);
    }
    const url = res?.result?.signed_url;
    if (url) return url;
  }
  throw new Error('D1 export timed out waiting for signed_url');
}

async function pruneOld(env: Env, prefix: string, retentionDays: number, nowMs: number) {
  const cutoff = nowMs - retentionDays * 86400_000;
  let cursor: string | undefined;
  do {
    const list = await env.BACKUP_BUCKET.list({ prefix, cursor });
    for (const obj of list.objects) {
      // filename: <label>/<ISO-date>.sql ; use uploaded time for safety.
      if (obj.uploaded && obj.uploaded.getTime() < cutoff) {
        await env.BACKUP_BUCKET.delete(obj.key);
      }
    }
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
}

async function runBackup(env: Env, scheduledMs: number): Promise<void> {
  const targets = parseTargets(env.D1_TARGETS);
  const retention = Math.max(1, parseInt(env.RETENTION_DAYS || '60', 10));
  // Date string derived from the scheduled time (no Date.now in cold paths).
  const iso = new Date(scheduledMs).toISOString();
  const datePart = iso.slice(0, 19).replace(/[:T]/g, '-'); // 2026-06-27-03-17-00

  for (const t of targets) {
    try {
      const signedUrl = await exportDatabase(env, t.dbId);
      const dump = await fetch(signedUrl);
      if (!dump.ok || !dump.body) {
        throw new Error(`download failed: HTTP ${dump.status}`);
      }
      const key = `${t.label}/${datePart}.sql`;
      await env.BACKUP_BUCKET.put(key, dump.body, {
        httpMetadata: { contentType: 'application/sql' },
      });
      console.log(`[backup] stored ${key}`);
      await pruneOld(env, `${t.label}/`, retention, scheduledMs);
    } catch (e: any) {
      // Log and continue with other targets; surface for cron retries/alerts.
      console.error(`[backup] ${t.label} failed:`, e?.message || e);
      throw e; // non-zero so the failure is visible in cron logs
    }
  }
}

export default {
  // Cron entrypoint.
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runBackup(env, event.scheduledTime));
  },
  // Manual trigger for testing: GET /run with the secret in ?key=
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/run' && url.searchParams.get('key') === env.D1_REST_API_TOKEN) {
      try {
        await runBackup(env, Date.now());
        return new Response('backup ok\n');
      } catch (e: any) {
        return new Response('backup failed: ' + (e?.message || e) + '\n', { status: 500 });
      }
    }
    return new Response('typixnode d1 backup worker\n', { status: 200 });
  },
};
