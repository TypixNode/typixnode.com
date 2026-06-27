# 部署与安全：公开仓库 + GitHub Actions

> 适用于 `typixnode.com` 站点。本文记录为什么选择「**公开 GitHub 仓库 + GitHub Actions 部署到 Cloudflare**」这套方案，以及配套的安全红线、密钥/数据库隔离规范，和未来可能产生费用的临界点。
>
> 数据核对日期：2026-06-27（定价以官方页为准，见文末来源）。

---

## 1. 架构总览

```
                  公开 GitHub 仓库 (TypixNode/typixnode.com)
                              │  push
                              ▼
                  GitHub Actions  (.github/workflows/deploy.yml)
                  · npm ci  →  npm run build (astro build)
                  · wrangler deploy
                              │  使用仓库 Secrets 里的凭证
                              ▼
                       Cloudflare Workers (SSR)
              ┌───────────────┴───────────────┐
       push `staging` 分支 → staging 环境       tag v* → production
       staging.typixnode.com              typixnode.com
```

- **构建/部署逻辑全部写在 `deploy.yml`** —— 版本可控、可复现、可审计。
- **不使用 Cloudflare 自带的 Git 集成**（那套会和 Actions 抢域名、互相覆盖）。
- 凭证（Cloudflare API Token、Account ID）作为 **GitHub Repository Secrets** 注入，**不进入代码**。

---

## 2. 为什么用「公开仓库」？—— 免费额度

| 项目 | 公开仓库 | 私有仓库 |
|---|---|---|
| **GitHub Actions 分钟数** | **完全免费、无上限**（标准 GitHub-hosted runner） | 按计划赠送：Free 2,000 / Pro 3,000 / Team 3,000 / Enterprise 50,000 分钟/月，超出按分钟计费 |

> 这就是选公开仓库的核心动机：**public repo 的 Actions 标准 runner 分钟数永久免费、无配额**。
>
> ⚠️ 例外：**larger runner（大型机器）即使是公开仓库也照常收费**。我们只用标准 Linux runner（`ubuntu-latest`），所以不受影响。

**Linux 标准 runner 计费参考（仅私有仓库超额时才用得上）：**
- Linux 1-core：$0.002/分钟
- Linux 2-core (x64)：$0.006/分钟
- Windows 2-core：$0.010/分钟（比 Linux 贵）
- macOS 3/4-core：$0.062/分钟（最贵，约 Linux 的 10 倍 → **不要在 CI 用 macOS runner**）

---

## 3. 🔴 公开仓库的安全红线（必须遵守）

公开仓库 = 全世界都能看你的源码和提交历史。以下是**不可触碰**的红线：

### 3.1 绝不把任何密钥提交进仓库
包括但不限于：
- Cloudflare API Token / Account ID
- Stripe `sk_live_...` / `sk_test_...`、Webhook `whsec_...`
- Resend `re_...`
- 任何数据库连接串、私钥、`.pem`、`.env`、`.dev.vars`

**当前仓库状态（已核查 ✅）：**
- `.gitignore` 已忽略 `.env`、`.env.*`、`.dev.vars`、`.wrangler/`、`node_modules/`、`dist/`、`.astro/`
- `.dev.vars` **未被 git 跟踪**，git 历史中**从未提交过** `.dev.vars` / `.env`
- 源码中**无硬编码密钥**（`src/env.d.ts` 里的 `sk_live_...` 只是注释示例，密钥实际从环境变量读取）

### 3.2 密钥一旦进过历史，改 .gitignore 也没用
git 历史是公开的。**只要某次 commit 里出现过密钥，即使后来删掉，历史里依然能翻出来。**
- 真发生了 → 必须 **① 立刻在源头吊销/重置该密钥（roll）② 用 `git filter-repo` 清理历史并强推**。
- 二者缺一不可，只做其中一个等于没做。

### 3.3 密钥的唯一存放位置 = GitHub Repository Secrets
路径：仓库 → **Settings → Secrets and variables → Actions → New repository secret**

CI 通过 `${{ secrets.XXX }}` 引用，运行时注入，**日志里自动打码**。当前已配置：

| Secret 名 | 用途 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | wrangler 部署鉴权 |
| `CLOUDFLARE_ACCOUNT_ID` | 指定 Cloudflare 账户 |

> 生产运行时的业务密钥（Stripe / Resend 等）**不放 GitHub**，而是用 `wrangler secret put <NAME>` 直接存到 Cloudflare Worker（见 §4）。

### 3.4 PR 来自 fork 时，Secrets 默认不下发
公开仓库会收到陌生人的 PR。GitHub 默认**不把 Secrets 暴露给来自 fork 的 PR workflow**，这是好事。
- 不要为了「让 fork PR 也能部署」去放宽这个设置。
- 部署只在 push 到 `staging` / 打 tag 时发生，不在 PR 上发生 —— 当前 `deploy.yml` 已是这样。

---

## 4. 密钥与数据库隔离规范

### 4.1 三处密钥，各司其职，互不混用

| 场景 | 密钥放哪 | 怎么用 |
|---|---|---|
| **本地开发** | `.dev.vars`（已 gitignore，**绝不提交**） | `astro dev` / `wrangler dev` 自动读取 |
| **CI 部署鉴权** | GitHub Repository Secrets | `${{ secrets.* }}` |
| **生产运行时业务密钥** | Cloudflare Worker Secret | `wrangler secret put STRIPE_SECRET_KEY` 等 |

> 本地复制模板：`cp .dev.vars.example .dev.vars`，填入测试用 key。`.dev.vars.example` 是公开的模板（只有占位值），可以提交。

### 4.2 数据库（D1）环境隔离 —— ⚠️ 当前存在隐患

`wrangler.jsonc` 中，**staging 和 production 目前指向同一个 D1 数据库**：

```
database_id: 4f59b60c-8e55-4f5d-9436-1f423986d39b   （production 和 staging 都是它）
```

**风险**：在 `staging.typixnode.com`（staging）做的下单/测试，会直接写进**生产数据库**。

**建议**：为 staging 单独建一个 D1 库，实现真正隔离：
```bash
wrangler d1 create typixnode-orders-staging
# 把返回的 database_id 填到 wrangler.jsonc 的 env.staging.d1_databases
```
本地开发用本地 D1：`npm run cf:migrate:local`（`--local`，不碰远程数据）。

---

## 5. 未来可能产生费用的临界点

整套方案目前**几乎零成本**。以下是各项免费额度与超出后的收费，便于提前预警。

### 5.1 GitHub Actions
- **公开仓库标准 runner：永久免费、无上限。** 唯一花钱点是误用 larger runner 或 macOS/Windows runner —— 我们不用，故 **$0**。

### 5.2 Cloudflare Workers（SSR 站点本体）

| | Free 计划 | Paid 计划（$5/月起） |
|---|---|---|
| 请求数 | **10 万次/天** | 1,000 万次/月含，超出 $0.30/百万 |
| CPU 时间 | 每次调用 10ms | 3,000 万 CPU 毫秒/月含，超出 $0.02/百万 |
| 静态资源请求 | 免费且无限 | 免费且无限 |

> **何时该升 $5 Paid**：日请求逼近 10 万次，或 SSR 单次 CPU 超过 10ms（复杂页面/接口容易触发）。$5 是账户级**保底**，不另收带宽费。

### 5.3 Cloudflare D1（数据库）

| | Free 计划 | Paid 计划 |
|---|---|---|
| 行读取 | 500 万/天 | 250 亿/月含，超出 $0.001/百万 |
| 行写入 | 10 万/天 | 5,000 万/月含，超出 $1.00/百万 |
| 存储 | 5 GB 总量 | 5 GB 含，超出 $0.75/GB·月 |

> ⚠️ **Free 计划超额行为不同**：D1 免费额度**用完会直接阻断查询**（每天 UTC 0 点重置），不是自动扣费。上线后若下单/查询量上来，需要主动升级到 Workers Paid。

### 5.4 一句话总结成本演进
```
现在：             $0        （Free Workers + Free D1 + 公开仓库 Actions）
首个付费门槛：      $5/月     （日请求破 10 万 或 SSR CPU 超限 → Workers Paid）
之后增量：          按量计费   （请求 $0.30/百万、D1 写入 $1/百万 等）
```

---

## 6. 上线前检查清单

- [ ] 仓库设为 Public 前，确认 §3 全部红线满足（已核查 ✅）
- [ ] `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 已配为 Repository Secrets ✅
- [ ] 生产业务密钥用 `wrangler secret put` 存到 Cloudflare，**不进 GitHub**
- [ ] 为 staging 建独立 D1 库，避免污染生产数据（§4.2，**待办**）
- [ ] 关闭/删除 Cloudflare 自带的 Git 集成，避免与 Actions 双重部署（**待办**）
- [ ] 设置 GitHub Actions 不向 fork PR 下发 Secrets（默认即如此，勿放宽）

---

## 来源

- [GitHub Actions 计费说明](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Cloudflare Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 定价](https://developers.cloudflare.com/d1/platform/pricing/)
