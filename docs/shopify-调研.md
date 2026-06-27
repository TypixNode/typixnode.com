# Shopify 调研（2026）：物流履约 · 便利性 · 抽成

> 面向 TypixNode（开源硬件、跨境、卖家在中国大陆）的实用评估。数据来自 2026-06 的公开资料，价格随时可能调整，以 Shopify 官网为准。

---

## 1. 物流：能不能"统一寄到它的海外仓，由它代发"？

**能——但要分清两件事：**

### 1.1 Shopify 自己已经不做仓库了
- Shopify 2019 年推出过自营履约网络（SFN），但 **2023 年把整个物流业务（含 Deliverr）卖给了 Flexport**，自己只占少数股权。
- 所以今天的 "Shopify Fulfillment Network" **不是 Shopify 的仓库**，而是一个**第三方 3PL 市场**：在后台一键对接合作的海外仓服务商。Shopify 只提供"协调层"（订单路由、库存可视、Shop Promise 标识），真正的入库/拣货/打包/发货由 3PL 完成。

### 1.2 你想要的模式 = 标准 3PL 履约，完全可行
流程就是你说的那样：
```
你批量备货 → 海运/空运到 3PL 海外仓 → 顾客下单
→ 订单自动路由到 3PL → 3PL 拣货打包发货 → 物流单号自动回传 Shopify → 通知买家
```

可在 Shopify 后台对接的主流 3PL：

| 服务商 | 仓库覆盖 | 拣货打包价（约） | 适合 |
|---|---|---|---|
| **ShipBob** | 全球 50+ 仓（美/加/英/欧/澳） | $2.5–5.0/单 | **跨境 DTC、多区域发货（最适合你）** |
| **Flexport**（SFN 首选） | 仅美国 5 仓（LA/达拉斯/芝加哥/亚特兰大/纽瓦克） | 按重量 | 美国为主、且自己走海运进口；**2026-01 起每月最低消费 $5,000** |
| ShipMonk | 美国 + 英国 + 墨西哥 | $2.5–4.0/单 | 订阅盒、小件 |
| Amazon MCF | 美国 100+ 中心 | $4–6/件 | 已在亚马逊卖货的 |
| DHL Fulfillment / GoBolt / Bigblue | 欧美等 | 各异 | 区域性 |

> ⚠️ **关键点**：这些 3PL **本身就提供 API / 集成，自建站（我们现在的 Astro 方案）一样能直接对接**。也就是说"寄到海外仓代发"**不是 Shopify 独有的能力**，不必为了物流而上 Shopify。Shopify 的价值是"在同一后台里点几下就接好"，省集成工。

---

## 2. Shopify 的便利之处（开箱即用清单）

- **完整电商内核**：购物车、结账（业界转化率标杆）、订单、库存、退款、客户账户——全有，零开发。
- **支付**：Shopify Payments（自营，免额外抽成）或对接 100+ 第三方网关。
- **物流工具**：Shopify Shipping（折扣运费 + 一键打单）、多仓库存、上面的 3PL 一键对接。
- **税费**：自动按地区算税；美国/欧盟等可自动处理销售税/VAT 计算。
- **营销与转化**：弃购挽回、折扣码、礼品卡、邮件营销、Shopify Audiences（Plus）。
- **多渠道**：社媒/marketplace/POS 线下/甚至 AI 聊天内下单，库存统一。
- **国际化（Markets）**：多语言、多币种、按地区定价、结账显示关税（见第 3 节）。
- **App 生态 + 主题**：几千个插件、大量现成主题，几乎任何需求都有现成 App。
- **后台/对账/分析、7×24 客服、稳定性与合规**全托管，几乎零运维。

> 一句话：**Shopify 把"开店要操心的所有杂事"都打包了**，代价是月费 + 抽成 + 定制受限。

---

## 3. 跨境/国际化：Markets vs Managed Markets

| | **标准 Shopify Markets** | **Managed Markets**（原 Markets Pro，Global-e 提供） |
|---|---|---|
| 你的角色 | **Seller of Record（你担责）** | Global-e 做 **Merchant of Record（替你担责）** |
| 能力 | 多语言/多币种/本地化定价；结账可显示关税(DDP) | 代收并**代缴** VAT/关税、本地支付、欺诈/拒付兜底 |
| 税务申报 | **你自己注册并申报**（如欧盟 IOSS） | 全部由 Global-e 处理，你无需在各国注册 |
| 费用 | 标准支付费率（无额外大额抽成） | **约 6–6.5%/单 + 约 2.5% 汇率费**（"省心税"） |
| 可用地区 | 各国卖家 | **仅限 美国本土 / 部分加拿大、英国卖家** |

> ⚠️ **Managed Markets 不对中国大陆/香港卖家开放**。所以"一键合规跨境"这个最省心的功能，你用不了，仍需自己处理 IOSS/关税。

---

## 4. 费用与抽成（2026）

### 4.1 套餐月费

| 套餐 | 月付 | 年付（折合/月） | 适合 |
|---|---|---|---|
| Starter | $5 | — | 仅社媒/链接卖货，无完整店铺 |
| **Basic** | **$39** | **$29** | 新店、年 GMV < 100 万美元（**你起步用这个**） |
| Grow（原 "Shopify"） | $105 | $79 | 年 GMV 100–300 万 |
| Advanced | $399 | $299 | 300 万+，需高级报表/国际运费 |
| Plus | 从 $2,300 起 | 定制 | 企业级，过阈值后按 GMV 0.25%~抽成 |

### 4.2 支付费率（这才是真正的"抽成"）

**A. 用 Shopify Payments（自营，无额外抽成）——但中国大陆卖家用不了：**

| 套餐 | 线上刷卡费率 | 第三方网关"额外抽成" |
|---|---|---|
| Basic | 2.9% + 30¢ | **+2.0%** |
| Grow | 2.6–2.7% + 30¢ | **+1.0%** |
| Advanced | 2.4–2.5% + 30¢ | **+0.5–0.6%** |
| Plus | ~2.15% + 30¢（可谈） | +0.2% |

**B. Shopify Payments 可用地区**：美、加、英、欧盟大部分、澳、新、新加坡、**日本、香港**、南非等约 38 国/地区。
- **中国大陆：不支持。** 必须用第三方网关（Stripe/PayPal/Adyen/PingPong/连连等）。
- **香港 SAR：可用**（需香港 BRN + 当地实体/实际经营地址；个人/独资还需本人居住在香港）。香港费率约 **3.1–3.3% + 2.35 HKD**，非港币结算再 +2% 汇率费。

### 4.3 ⚠️ 中国大陆卖家的真实成本测算
因为用不了 Shopify Payments，你的每单成本 = **第三方网关费 + Shopify 额外抽成**：

```
例：Basic 套餐 + Stripe 收款
≈ Stripe 2.9% + $0.30  +  Shopify 额外 2.0%
≈ 单笔 ~5% + $0.30
```
- 升到 Grow（$105/月）能把 Shopify 那块从 2.0% 降到 1.0%；Advanced（$399/月）降到 0.5–0.6%。
- 所以对中国卖家：**月费越高 → 单笔抽成越低**，需按销量找平衡点。

> 对比我们现在的自建栈：**Stripe 2.9% + $0.30，没有任何平台月费、没有额外抽成**。这是自建最大的成本优势。

---

## 5. 对 TypixNode 的关键结论

1. **物流不是上 Shopify 的理由**：你要的"海外仓代发"用 ShipBob 等 3PL 即可，自建站也能直接接，不必为此换平台。
2. **支付是中国卖家最大的痛点**：无论 Shopify 还是自建，都得用第三方网关。Shopify 还要在网关费之上再抽 0.5–2%；自建只付网关费。
3. **Shopify 的真正价值**＝省去自己写购物车/订单/税费/营销/多渠道的工作量 + 成熟生态；代价是月费($39 起) + 额外抽成 + 定制受限 + 与"开源可 hack"调性不符。
4. **省心跨境合规（Managed Markets）你用不了**（不开放给中国大陆/香港卖家）。
5. **建议**：你已选择"继续自建"，且只有 4 款产品、销量起步阶段——**自建 + Stripe + 一个 3PL（如 ShipBob）做履约**，是成本最低、最契合品牌的组合。等订单量大到"运营杂事吃掉太多时间"时，再评估迁 Shopify（届时可考虑香港实体以启用 Shopify Payments，省掉额外抽成）。

---

## 6. 参考来源
- Shopify 官方定价：https://www.shopify.com/pricing
- Shopify 套餐对比（2026）：https://profitcalcu.com/blog/shopify-plan-comparison-2026/
- 履约现状（SFN 已转 3PL 市场）：https://qualimero.com/en/blog/shopify-fulfillment ・ https://nventory.io/blog/shopify-fulfillment-guide-in-house-3pl-apps
- Shopify 官方 3PL 合作伙伴：https://help.shopify.com/en/manual/fulfillment/shopify-fulfillment-network/logistics-partners
- Flexport 履约（2026 最低消费 $5,000）：https://3plinsider.com/reviews/flexport
- 中国卖家支付设置（官方）：https://help.shopify.com/en/manual/intro-to-shopify/initial-setup/sell-in-china/set_up_payments
- 香港 Shopify Payments 要求（官方）：https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries/hong-kong/requirements
- Managed Markets（官方）：https://help.shopify.com/en/manual/international/managed-markets
