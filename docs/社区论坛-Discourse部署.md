# 社区论坛部署（Discourse · 国内外一套）

主站已在导航加入 **Community** 入口，指向 `https://forum.typixnode.com`（见 `src/components/Nav.astro` 的 `FORUM_URL`）。本文是把这个子域名跑起来的最小可行步骤。

> 选型理由见 `docs/架构选型-跨境支付与社区.md`：Discourse 是产品社区的行业标准（GitHub/Docker/Cloudflare 都在用），支持 SSO、多语言分类、强审核。一套实例开"中文 / English"分类即可，不做两套。

---

## 1. 准备
- 一台 **海外 VPS**（≥ 2GB RAM，建议 4GB；2 vCPU / 40GB SSD）。Hetzner / DigitalOcean / Vultr 均可。
- 域名 `typixnode.com` 的 DNS 托管在 **Cloudflare**。
- 一个 **事务邮件**服务（Discourse 强依赖 SMTP）：Resend（站点已在用）、Mailgun、Postmark、AWS SES 皆可。

## 2. DNS（Cloudflare）
新增一条记录：
```
A   forum   <VPS_IP>   # 重要：先设为「DNS only / 灰云」
```
> 安装期间必须关掉 Cloudflare 代理（灰云），否则 Let's Encrypt 签发会失败。装完拿到证书后可改回橙云并开启 SSL=Full(strict)。

## 3. 安装 Discourse（官方 Docker 启动器）
```bash
# 在 VPS 上，以 root
git clone https://github.com/discourse/discourse_docker.git /var/discourse
cd /var/discourse
./discourse-setup
```
向导会问：
- **Hostname**: `forum.typixnode.com`
- **Admin email**: 你的管理员邮箱
- **SMTP**: 填邮件服务的 host/port/user/pass
  - Resend 示例：`smtp.resend.com` : `587`，用户名 `resend`，密码=你的 Resend API key
- **Let's Encrypt email**: 用于自动签发 HTTPS 证书

向导结束后会自动 `./launcher rebuild app` 并启动。访问 `https://forum.typixnode.com` 完成首个管理员注册。

升级 / 改配置后重建：
```bash
cd /var/discourse && ./launcher rebuild app
```

## 4. 多语言分类（一套实例）
后台 `Admin → Settings`：
- `default locale` = `en`，开启 `allow user locale`（用户可切中文界面）。
- `Categories` 建两个父分类：**English** 和 **中文社区**（再细分 公告 / 问答 / 展示作品 / Bug 反馈）。
- 安装官方多语言/翻译插件（可选）：`discourse-translator`。

## 5. SSO：主站账号登录论坛（DiscourseConnect）
让用户用 TypixNode 账号直接登录论坛（未来主站有账号体系时启用）：
- 后台开启 `enable discourse connect`，设置 `discourse connect url` = 主站的 SSO 端点，`discourse connect secret` = 共享密钥。
- 主站侧实现一个 `/sso` 端点：校验签名 → 返回用户 `external_id/email/username`。
- 现在没有账号体系，可先用 **GitHub 登录**（`Admin → Login → 启用 GitHub`），对开源用户最友好，零开发。

## 6. 国内访问优化
- 海外 VPS + Cloudflare 橙云通常可访问，但**速度不稳**。
- 若要国内稳定/合规：
  - 方案 A：国内服务器 + **ICP 备案**（需国内主体），同一套 Discourse 镜像。
  - 方案 B：保持海外，用 Cloudflare + 国内可达的加速；先观察流量再投入备案。
- 起步建议先 **海外一套**，国内体量起来再加备案镜像。

## 7. 上线后
- `Admin → Backups` 打开每日自动备份（存到对象存储如 R2/S3）。
- 把 `FORUM_URL` 换成最终域名（若不是 `forum.typixnode.com`）。
- 在主站首页/Footer 也可加社区入口（当前已在顶部导航）。

---

### 备选：更轻量
若不想维护 Ruby/Docker（≥2GB RAM）：用 **Flarum**（PHP/Laravel，1GB VPS 即可，`composer create-project flarum/flarum`）。功能少但省心，适合中小社区起步。
