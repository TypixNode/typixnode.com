# PayPal 正式商户上架清单（大陆公司 · 跨境收款）

> 目标：把 `typixnode.com` 的 PayPal 从 **sandbox 测试** 切到 **live 正式收真钱**。
> 主体：中国大陆公司。收款对象：海外买家（全球）。
> 资料核对日期：2026-06-27（PayPal 政策常变，以官网为准，见文末）。

---

## 0. 先理清：你要的是「PayPal 全球」跨境账户

PayPal 在中国有两套体系，别搞混：

| 体系 | 用途 | 你要哪个 |
|---|---|---|
| **PayPal 全球**（国际版） | 跨境收海外买家的钱 | ✅ **就是这个** |
| PayPal 中国境内（通过国付宝 GoPay） | 境内人民币支付 | ❌ 不是这个 |

你网站卖给全球客户、用美元结算，所以走 **PayPal 全球商业账户（Business）**。

---

## 1. 法人本人需要到场吗？

**不一定需要法人本人亲自操作刷脸**（比 Stripe / 支付宝宽松），但：

- ✅ 需要 **法人的身份证信息**（填资料、风控审核用）
- ✅ 需要 **公司对公银行账户**（收款提现结汇）
- ✅ 你作为管理员/经办人通常**可以完成全部操作**，法人不必坐在电脑前
- ⚠️ 但完全脱离法人不行：法人身份信息和（可能的）授权要拿得到

> 对比：Stripe / 支付宝电脑网站支付强制法人刷脸 → 非法人卡死；PayPal 主要靠**营业执照 + 法人资料 + 对公账户**审核。

---

## 2. 申请前要备齐的材料

齐全了再开始，中途缺料会卡审核。

| 材料 | 要点 |
|---|---|
| **营业执照** | 有效；记下公司的 **英文名**（PayPal 是英文系统，收款方/对账显示英文名） |
| **法人身份证** | 姓名 + 号码 |
| **公司对公银行账户** | 收款提现结汇的落脚点，**必须有**。记下开户行、账号、SWIFT（跨境可能需要） |
| **业务信息** | 网站 `https://typixnode.com`、业务描述（紧凑开源硬件 / open hardware）、客服邮箱（如 hello@typixnode.com） |
| **公司联系方式** | 地址、电话 |

---

## 3. 申请步骤

### ① 升级为商业账户
1. 登录 **`paypal.com`**（正式商户后台，**不是** developer.paypal.com）
2. 找到 **Upgrade to Business / 升级为商业账户**
3. 按引导提交第 2 节的材料
4. 等 PayPal 审核（通常几天）

### ② 绑定 + 验证对公账户
- 绑定公司对公银行账户用于提现
- 可能有小额打款验证 / 资料审核

### ③ 拿 live 凭证（审核通过后）
1. 去 **`developer.paypal.com`** → **切换到 Live 标签**（不是 Sandbox）
2. 进 **Apps & Credentials** → 你的 App → 复制：
   - **live Client ID**
   - **live Secret**
3. 在 **Live** 下注册 webhook：
   - URL：`https://typixnode.com/api/webhooks/paypal`
   - 事件：`PAYMENT.CAPTURE.COMPLETED`（可加 declined/denied）
   - 拿到 **live Webhook ID**（形如 `WH-...`）

---

## 4. 拿到 live 凭证后 → 交给开发配置（这部分我来做）

把以下三个值给我（Client ID 可公开，Secret/Webhook ID 保密）：
- `live Client ID`
- `live Secret`
- `live Webhook ID`

我会：
1. 配到**生产 worker**（`typixnode-com`）：`PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` / `PAYPAL_WEBHOOK_ID`，并设 `PAYPAL_ENV=live`
2. 确认生产 webhook 路由 `https://typixnode.com/api/webhooks/paypal` 通
3. **前置依赖**：先用受控流程（打 `v*` tag）把 main 代码正式部署到生产，确保 `typixnode.com` = main 的确切代码（当前生产是非受控部署，版本需厘清）
4. 用真实小额订单验证收款 → 提现链路

---

## 5. 成本与注意

- **收款费率**：跨境约 **4.4% + 固定费/笔**（按地区浮动）
- **提现**：结汇到对公账户有**汇率损耗 + 手续费**
- **收款方名称** = 营业执照英文名，要和能结汇的对公账户主体一致
- **沙盒 ≠ 正式**：现在 staging 用的是 sandbox 凭证，收不了真钱；live 是完全独立的另一套凭证和 webhook

---

## 6. 当前进度

- [x] Sandbox 跑通（staging 已验证 PayPal 下单→支付→订单 paid）
- [ ] 备齐材料（第 2 节）
- [ ] 升级 PayPal 商业账户并通过审核
- [ ] 绑定验证对公账户
- [ ] 拿到 live 凭证（Client ID / Secret / Webhook ID）
- [ ] 生产受控部署（打 tag）+ 配 live 凭证 + 验证收款

---

## 来源

- [PayPal 商业账户](https://www.paypal.com/)
- [PayPal Developer（凭证 / webhook）](https://developer.paypal.com/)
- 注：PayPal 大陆政策与提现规则随时间变化，申请前以官网与客服确认为准。
