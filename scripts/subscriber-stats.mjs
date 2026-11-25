// Read-only aggregate report. Never print subscriber addresses or credential values.
import { writeFileSync } from 'node:fs';
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token, STATS_OUTPUT: output } = process.env;
if (!account || !token || !output) throw new Error('Missing statistics configuration');
const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/4f59b60c-8e55-4f5d-9436-1f423986d39b/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ sql: 'SELECT email,status,lang,source,confirmed_at,unsubscribed_at FROM subscribers' }),
});
const result = await response.json();
if (!response.ok || !result.success || !result.result?.[0]?.success) throw new Error(`D1 statistics query failed (HTTP ${response.status})`);
const rows = result.result[0].results;
const normalize = value => String(value || '').trim().toLowerCase();
const valid = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
const grouped = key => Object.fromEntries([...new Set(rows.map(row => row[key] || '(none)'))].map(value => [value, rows.filter(row => (row[key] || '(none)') === value).length]));
// Never include an address with a suppression status, even in a legacy duplicate row.
const suppressed = new Set(rows.filter(row => ['unsubscribed','bounced'].includes(row.status) || row.unsubscribed_at).map(row => normalize(row.email)));
const eligible = rows.filter(row => row.status === 'active' && row.confirmed_at && valid(normalize(row.email)) && !suppressed.has(normalize(row.email)));
const report = {
  queried_at: new Date().toISOString(),
  total_rows: rows.length,
  unique_addresses: new Set(rows.map(row => normalize(row.email))).size,
  duplicate_rows: rows.length - new Set(rows.map(row => normalize(row.email))).size,
  by_status: grouped('status'), by_language: grouped('lang'), by_source: grouped('source'),
  invalid_address_rows: rows.filter(row => !valid(normalize(row.email))).length,
  active_without_confirmation: rows.filter(row => row.status === 'active' && !row.confirmed_at).length,
  eligible_unique: new Set(eligible.map(row => normalize(row.email))).size,
  eligible_by_language: Object.fromEntries([...new Set(eligible.map(row => row.lang))].map(lang => [lang, new Set(eligible.filter(row => row.lang === lang).map(row => normalize(row.email))).size])),
  note: 'Website-wide newsletter; source is a signup location, not proof of a product-specific subscription. No messages sent.',
};
writeFileSync(output, JSON.stringify(report, null, 2), { mode: 0o600 });
console.log('Read-only aggregate report prepared. No addresses or tokens exported.');
