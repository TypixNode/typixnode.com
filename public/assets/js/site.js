/* ===================== TypixNode shared site JS ===================== */
(function () {
  "use strict";

  /* ---------- product catalogue (single source of truth) ---------- */
  var PRODUCTS = {
    typixdeck: { img: "/assets/cyberdeck.png", usd: 599,
      name: { en: "TypixDeck", zh: "TypixDeck", ja: "TypixDeck" } },
    keyboard: { img: "/assets/keyboard.jpg", usd: 129,
      name: { en: "BLE Keyboard", zh: "蓝牙键盘", ja: "BLE キーボード" } },
    diysuite: { img: "/assets/diysuite.jpg", usd: 59,
      name: { en: "DIY Suite", zh: "DIY 套件", ja: "DIY スイート" } },
    picomac: { img: "/assets/picomac.jpg", usd: 60,
      name: { en: "Pico-Mac Nano", zh: "Pico-Mac Nano", ja: "Pico-Mac Nano" } }
  };

  /* ---------- currency ---------- */
  var CUR = {
    USD: { sym: "$", rate: 1, dec: 0 },
    EUR: { sym: "€", rate: 0.92, dec: 0 },
    GBP: { sym: "£", rate: 0.79, dec: 0 },
    CNY: { sym: "¥", rate: 7.2, dec: 0 },
    JPY: { sym: "¥", rate: 156, dec: 0 }
  };
  function money(usd, cur) {
    var c = CUR[cur] || CUR.USD;
    var v = usd * c.rate;
    var s = v.toFixed(c.dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return c.sym + s;
  }

  /* ---------- i18n ---------- */
  var I18N = {
    en: {
      "doc.home": "TypixNode — Compact Open Hardware",
      "doc.deck": "TypixDeck — A fanless Linux computer | TypixNode",
      "nav.deck": "TypixDeck", "nav.all": "All products", "nav.tech": "Technology",
      "nav.features": "Features", "nav.inside": "Inside", "nav.specs": "Specs",
      "nav.faq": "FAQ", "nav.open": "Open", "nav.buy": "Buy now",
      "hero.badge": "Compact open hardware · Est. 2026",
      "home.h1": 'Full computers,<br/>the size of <span class="grad">your palm.</span>',
      "home.lead": "A small, carefully made family of machines — the fanless milled-aluminum TypixDeck, a card-sized keyboard, and a wearable Macintosh. Bench-tested, open-source, shipped worldwide.",
      "home.cta1": "Meet TypixDeck →", "home.cta2": "Browse all products",
      "pin.fanless": "Fanless · CM5", "pin.stock": "In stock", "pin.silent": "Truly silent",
      "save.title": "SAVE $100", "save.sub": "launch price",
      "prod.kicker": "The catalogue", "prod.title": "All products",
      "prod.sub": "Four machines · open-source · shipped worldwide", "prod.scroll": "Scroll",
      "tag.flagship": "Flagship",
      "p.deck.ds": "Fanless milled-aluminum Linux computer with a Raspberry Pi Compute Module. Silent, sealed, open.",
      "p.kb.ds": "Card-sized full keyboard with gyro air-mouse and white backlight. Bluetooth 5.2 or USB-C.",
      "p.diy.ds": "Solder your own 48-key keyboard in an afternoon. Open-source PCB and QMK firmware.",
      "p.mac.ds": "A 1984 Macintosh shrunk to your palm. Boots real classic Mac OS over USB-C.",
      "why.kicker": "Why TypixNode", "why.title": "Built small. Built open.",
      "why.1t": "Fanless & silent", "why.1p": "Milled-aluminum bodies double as heatsinks — full performance at 0 dB, no fans to fail.",
      "why.2t": "Fully open source", "why.2p": "Schematics, firmware and STEP files are all public, so you can repair, mod and build on everything.",
      "why.3t": "Pocket-sized", "why.3p": "From a palm computer to a card-sized keyboard, every device is made to travel with you.",
      "cta.home.t": "Start with TypixDeck", "cta.home.p": "A silent, open, milled-aluminum Linux computer that fits in your hand. Join 4,200+ makers.",
      "cta.home.b1": "Meet TypixDeck", "cta.home.b2": "See all products",
      "ft.tag": "Compact open hardware, designed and milled in small batches. Built tiny, shipped worldwide.",
      "ft.products": "Products", "ft.company": "Company", "ft.open": "Open",
      "ft.about": "About", "ft.support": "Support", "ft.shipping": "Shipping", "ft.warranty": "Warranty",
      "ft.cad": "CAD files", "ft.fw": "Firmware", "ft.docs": "Docs",
      "ft.copy": "© 2026 TypixNode — Compact Open Hardware",
      /* product page */
      "deck.h1": 'A fanless Linux computer,<br/><span class="grad">milled from a single block.</span>',
      "deck.lead": "Meet TypixDeck — a silent, sealed, palm-sized machine carved from aerospace aluminum and built around a Raspberry Pi Compute Module. Open it, hack it, make it yours.",
      "deck.add": "Add to cart →", "deck.look": "Look inside",
      "deck.ship": "· free worldwide shipping",
      "deck.trust": "In stock · ships in 2–3 days · 2-year warranty · 4,200+ makers",
      "st.fanless": "Fanless", "st.alu": "CNC aluminum", "st.pi": "Raspberry Pi", "st.open": "Open source",
      "st.social": "<b>4,200+</b> makers already build on TypixNode hardware.",
      "f.kicker": "Why it's different", "f.title": "Everything a tiny computer should be",
      "f.sub": "No fan to fail, no plastic to flex, no firmware locked away — just beautifully made machines you fully control.",
      "f.1t": "Milled unibody", "f.1p": "Carved from a single block of 6061-T6 aluminum, bead-blasted and anodized. Rigid, cool to the touch, built to last decades.",
      "f.2t": "Truly silent — 0 dB", "f.2p": "The chassis is the heatsink. No fan, no vents, no dust. Sustained full load stays cool and completely silent.",
      "f.3t": "Raspberry Pi CM4 / CM5", "f.3p": "Drop in the compute module you want, upgrade later.",
      "f.4t": "Full I/O", "f.4p": "HDMI, USB-C, dual USB-A, Ethernet, 40-pin GPIO.",
      "f.5t": "Open CAD & firmware", "f.5p": "Every STEP file, schematic and image on GitHub.",
      "f.6t": "Credit-card footprint", "f.6p": "Smaller than your phone, heavier than it looks. It slips into a bag and runs a full Linux desktop anywhere.",
      "in.kicker": "Made to be opened", "in.title": "Four screws and you're inside.",
      "in.1": "<b>Tool-friendly.</b> Captive screws, labeled connectors and a documented teardown — no glue anywhere.",
      "in.2": "<b>Swap the brain.</b> The compute module sits on a standard socket. Move up to CM5 in minutes.",
      "in.3": "<b>Expand it.</b> M.2 slot for NVMe, a 40-pin header for HATs, internal headers for add-ons.",
      "in.4": "<b>Repair, don't replace.</b> Spare parts and CAD are public, so a scratched lid never means a new computer.",
      "in.git": "Open CAD on GitHub ↗",
      "r.1k": "Silent desktop", "r.1t": "A full Linux desktop that makes no sound", "r.1p": "Boot straight into Raspberry Pi OS or your distro of choice. Code, SSH, browse and tinker — with zero fan noise on your desk.",
      "r.2k": "Pocket input", "r.2t": "Pairs with a card-sized keyboard", "r.2p": "Add the TypixNode BLE Keyboard for a complete pocket workstation — full layout, gyro air-mouse and white backlight over Bluetooth or USB-C.",
      "r.3k": "For tinkerers", "r.3t": "Hardware that invites curiosity", "r.3p": "From a palm-sized 1984 Mac to a solder-it-yourself keyboard kit, every TypixNode device is designed to be opened, understood and modified.",
      "lu.kicker": "The full lineup", "lu.title": "Four machines. Pick your size.", "lu.sub": "A small, carefully made catalogue — no filler, every product is something we'd carry ourselves.",
      "sp.kicker": "TypixDeck", "sp.title": "Technical specifications",
      "sp.compute": "Compute", "sp.chassis": "Chassis", "sp.cooling": "Cooling", "sp.storage": "Storage",
      "sp.ports": "Ports", "sp.wireless": "Wireless", "sp.dim": "Dimensions", "sp.os": "Open source",
      "sp.compute.v": "Raspberry Pi Compute Module 4 or 5 (socketed)",
      "sp.chassis.v": "CNC-milled 6061-T6 aluminum, bead-blasted & anodized",
      "sp.cooling.v": "Passive — chassis acts as heatsink, 0 dB",
      "sp.storage.v": "microSD + internal M.2 NVMe slot",
      "sp.ports.v": "HDMI, USB-C (PD), 2× USB-A, Gigabit Ethernet, 40-pin GPIO",
      "sp.wireless.v": "Wi-Fi 5 / Bluetooth 5.0 (CM-dependent)",
      "sp.dim.v": "95 × 62 × 22 mm · 280 g",
      "sp.os.v": "Full STEP files, schematics & firmware on GitHub",
      "faq.kicker": "Good to know", "faq.title": "Frequently asked questions",
      "faq.q1": "Does it come with a Raspberry Pi Compute Module?", "faq.a1": "The TypixDeck ships as a chassis kit. Add a CM4 or CM5 at checkout, or drop in one you already own — it uses the standard compute-module socket.",
      "faq.q2": "How does a fanless computer stay cool?", "faq.a2": "The aluminum unibody is the heatsink. The compute module is thermally bonded to the chassis, so heat spreads across the whole body and dissipates silently, even under sustained load.",
      "faq.q3": "Can I really open and repair it myself?", "faq.a3": "Yes. Four captive screws, no glue, labeled connectors, and a public teardown guide. Spare parts and CAD files are available so you can repair or modify anything.",
      "faq.q4": "Do you ship worldwide?", "faq.a4": "Yes — free worldwide shipping, typically 2–3 business days handling plus carrier transit. Duties may apply depending on your region.",
      "cta.deck.t": "Build your pocket Linux lab", "cta.deck.p": "Silent, open, and made to be opened. Join 4,200+ makers running TypixNode hardware.",
      "cta.deck.b2": "See all products",
      /* cart */
      "cart.title": "Your cart", "cart.empty": "Your cart is empty.", "cart.sub": "Subtotal",
      "cart.checkout": "Checkout", "cart.note": "Taxes & shipping calculated at checkout.", "cart.add": "Add to cart",
      "cart.unavailable": "Online payment is being set up — please check back soon.",
      "see.all": "See all products", "look": "Look inside",
      "doc.kb": "BLE Keyboard — card-sized wireless keyboard | TypixNode",
      "kb.h1": 'A full keyboard,<br/><span class="grad">the size of a card.</span>',
      "kb.lead": "Pocket-sized but full-featured — a complete QWERTY layout with a built-in gyro air-mouse and a crisp white backlight. Pairs over Bluetooth 5.2 or USB-C with phones, tablets, TVs and your TypixDeck.",
      "kb.s1l": "Wireless", "kb.s2l": "Air mouse", "kb.s3l": "Weight", "kb.s4l": "Charging",
      "kb.row.t": "Point without a mouse", "kb.row.p": "A 6-axis gyroscope turns the whole keyboard into a pointer — tilt to move the cursor and click with your thumbs. Perfect for a TV or a TypixDeck across the room.",
      "kb.feat": "Small, but it does everything",
      "kb.f1t": "Air-mouse built in", "kb.f1p": "A tilt-to-point gyro pointer plus dedicated mouse keys — no flat surface needed.",
      "kb.f2t": "Backlit & rechargeable", "kb.f2p": "Crisp white backlight and a USB-C rechargeable battery that lasts weeks per charge.",
      "kb.f3t": "Works with everything", "kb.f3p": "Bluetooth 5.2 or wired USB-C, with instant pairing to phones, tablets, TVs and your TypixDeck.",
      "kb.spk1": "Layout", "kb.spv1": "64-key QWERTY with function row",
      "kb.spk2": "Pointing", "kb.spv2": "6-axis gyroscope air-mouse + mouse keys",
      "kb.spk3": "Wireless", "kb.spv3": "Bluetooth 5.2 + USB-C wired",
      "kb.spk4": "Backlight", "kb.spv4": "Adjustable white LED",
      "kb.spk5": "Battery", "kb.spv5": "Rechargeable Li-Po, USB-C",
      "kb.spk6": "Dimensions", "kb.spv6": "139 × 78 × 13 mm · 120 g",
      "kb.q1": "What can I use it with?", "kb.a1": "Anything that supports a Bluetooth or USB HID keyboard — phones, tablets, smart TVs, single-board computers, and of course the TypixDeck.",
      "kb.q2": "How long does the battery last?", "kb.a2": "Several weeks of typical use per charge. It charges over USB-C and can be used while charging.",
      "kb.cta.t": "Add a keyboard to your kit", "kb.cta.p": "The pocket companion for your TypixDeck — a full layout, air-mouse and backlight in a card-sized body.",
      "doc.diy": "DIY Suite — open-source keyboard build kit | TypixNode",
      "diy.h1": 'Solder your own<br/><span class="grad">keyboard.</span>',
      "diy.lead": "An open-source build kit that turns an afternoon into a keyboard you made yourself. A through-hole-friendly PCB, an illustrated step-by-step guide and a satisfying clicky feel — no experience required.",
      "diy.s1l": "Build time", "diy.s2l": "Keys", "diy.s3l": "Firmware", "diy.s4l": "Open source",
      "diy.row.t": "An afternoon well spent", "diy.row.p": "Everything is in the box — PCB, plate, switches, keycaps and an illustrated guide. Follow along step by step and finish with a board that's entirely yours.",
      "diy.feat": "A kit, not a chore",
      "diy.f1t": "Beginner-friendly", "diy.f1p": "Through-hole soldering, labeled parts and an illustrated guide. If you can hold an iron, you can build it.",
      "diy.f2t": "Open-source PCB", "diy.f2p": "The full PCB design and bill of materials are public — remix the layout and make it yours.",
      "diy.f3t": "QMK firmware", "diy.f3p": "Remap every key, add layers and macros, and tune the board exactly how you like.",
      "diy.spk1": "Layout", "diy.spv1": "48-key ortholinear",
      "diy.spk2": "PCB", "diy.spv2": "Open-source, through-hole",
      "diy.spk3": "Firmware", "diy.spv3": "QMK-compatible",
      "diy.spk4": "Switches", "diy.spv4": "Hot-swap compatible footprints",
      "diy.spk5": "Includes", "diy.spv5": "PCB, plate, switches, keycaps, guide",
      "diy.spk6": "Build time", "diy.spv6": "About 2 hours",
      "diy.q1": "Do I need soldering experience?", "diy.a1": "No. The kit uses beginner-friendly through-hole components and ships with an illustrated, step-by-step guide. A basic soldering iron is all you need.",
      "diy.q2": "Can I customize the layout?", "diy.a2": "Yes. The PCB design is open-source and the board runs QMK, so you can remap keys, add layers and macros, and even fork the hardware.",
      "diy.cta.t": "Build it yourself", "diy.cta.p": "An open PCB, an illustrated guide and a satisfying click — your first keyboard build, start to finish.",
      "doc.mac": "Pico-Mac Nano — a palm-sized 1984 Macintosh | TypixNode",
      "mac.h1": 'A 1984 Macintosh,<br/><span class="grad">in your palm.</span>',
      "mac.lead": "A loving miniature of the original Macintosh that actually boots classic Mac OS. Power it over USB-C, watch the Happy Mac appear on a sharp little display, and run real vintage software.",
      "mac.s1l": "Display", "mac.s2l": "Boots", "mac.s3l": "Weight", "mac.s4l": "Power",
      "mac.row.t": "The Happy Mac lives again", "mac.row.p": "It's not a picture on a screen — it boots an emulated classic Macintosh, smiling Mac and all, then runs period-appropriate software on a crisp little display.",
      "mac.feat": "Tiny machine, real soul",
      "mac.f1t": "Boots real Mac OS", "mac.f1p": "Runs an emulated classic Macintosh System, Happy Mac included, on the built-in display.",
      "mac.f2t": "USB-C powered", "mac.f2p": "No batteries, no fuss — plug into any USB-C port and the System starts in seconds.",
      "mac.f3t": "A faithful miniature", "mac.f3p": "Modeled on the 1984 original down to the beige curves and floppy slot — a desk toy with real soul.",
      "mac.spk1": "Display", "mac.spv1": "2-inch, classic black & white UI",
      "mac.spk2": "System", "mac.spv2": "Emulated classic Mac OS (Happy Mac)",
      "mac.spk3": "Power", "mac.spv3": "USB-C, no internal battery",
      "mac.spk4": "Storage", "mac.spv4": "microSD with system image",
      "mac.spk5": "Body", "mac.spv5": "Injection-molded, 1984-faithful",
      "mac.spk6": "Dimensions", "mac.spv6": "60 × 44 × 66 mm · 90 g",
      "mac.q1": "Does it really run Mac OS?", "mac.a1": "Yes — it boots an emulated classic Macintosh System, complete with the Happy Mac, on its built-in display, and can run period-appropriate software.",
      "mac.q2": "How is it powered?", "mac.a2": "Over USB-C. There's no internal battery; plug it into any USB-C source and it boots in a few seconds.",
      "mac.cta.t": "Put 1984 on your desk", "mac.cta.p": "A palm-sized Macintosh that really boots — the most charming desk toy a computer person can own.",
      "about.doc": "About — TypixNode", "about.kicker": "Our story", "about.h1": "We make a few machines, very well.",
      "about.lead": "TypixNode is a tiny studio that designs, mills and bench-tests compact open hardware in small batches. We'd rather make four things we love than forty we don't.",
      "about.believe": "What we believe", "about.story": "Open CAD, schematics and firmware in every box; small, hand-checked batches; and parts you can replace. That's the whole idea.",
      "about.v1t": "Built to be opened", "about.v1p": "Every product ships with public CAD, schematics and firmware. If you own it, you should be able to understand and repair it.",
      "about.v2t": "Small batches, high care", "about.v2p": "We mill, assemble and test in small runs. Each unit is checked by hand before it ships.",
      "about.v3t": "Made to last", "about.v3p": "Metal where it matters, standard sockets, replaceable parts. Hardware that earns a long life, not a landfill.",
      "support.doc": "Support — TypixNode", "support.kicker": "Help & support", "support.h1": "We're here to help.",
      "support.lead": "Shipping, returns, warranty and setup — the essentials are below. Still stuck? Email us and a human replies.",
      "support.s1t": "Shipping", "support.s1p": "Free worldwide shipping. Orders ship in 2–3 business days; transit time depends on your region. Duties may apply on some routes.",
      "support.s2t": "Returns", "support.s2p": "30-day returns on unused items in original packaging. Reach out and we'll send a prepaid label where available.",
      "support.s3t": "Warranty", "support.s3p": "Every device carries a 2-year limited warranty against manufacturing defects. Repairs use genuine, documented parts.",
      "support.s4t": "Contact", "support.s4p": "Email hello@typixnode.com — we usually reply within one business day.",
      "err.title": "Page not found", "err.text": "The page you're looking for has been moved, milled away, or never existed.", "err.btn": "Back to home"
    },
    zh: {
      "doc.home": "TypixNode — 紧凑开源硬件",
      "doc.deck": "TypixDeck — 无风扇 Linux 电脑 | TypixNode",
      "nav.deck": "TypixDeck", "nav.all": "全部产品", "nav.tech": "技术",
      "nav.features": "特性", "nav.inside": "内构", "nav.specs": "规格",
      "nav.faq": "常见问题", "nav.open": "开源", "nav.buy": "立即购买",
      "hero.badge": "紧凑开源硬件 · 创立于 2026",
      "home.h1": '把完整算力，<br/>装进<span class="grad">掌心大小。</span>',
      "home.lead": "一个精心打造的小型机器家族——无风扇铝合金 TypixDeck、卡片大小的键盘，以及可随身的麦金塔。逐台测试、完全开源、全球发货。",
      "home.cta1": "了解 TypixDeck →", "home.cta2": "浏览全部产品",
      "pin.fanless": "无风扇 · CM5", "pin.stock": "现货", "pin.silent": "全程静音",
      "save.title": "立省 $100", "save.sub": "首发价",
      "prod.kicker": "产品目录", "prod.title": "全部产品",
      "prod.sub": "四款机器 · 开源 · 全球发货", "prod.scroll": "横向滑动",
      "tag.flagship": "旗舰",
      "p.deck.ds": "无风扇 CNC 铝合金 Linux 电脑，搭载树莓派计算模块。静音、密封、开源。",
      "p.kb.ds": "卡片大小全键盘，内置陀螺仪空中鼠标与白色背光。蓝牙 5.2 或 USB-C。",
      "p.diy.ds": "一个下午焊出你自己的 48 键键盘。开源 PCB + QMK 固件。",
      "p.mac.ds": "缩小到掌心的 1984 年麦金塔，USB-C 供电直接启动真实经典 Mac OS。",
      "why.kicker": "为何选择 TypixNode", "why.title": "做得小，做得开放。",
      "why.1t": "无风扇 · 静音", "why.1p": "铝合金机身即散热片——满载 0 分贝，没有会坏的风扇。",
      "why.2t": "完全开源", "why.2p": "原理图、固件与 STEP 模型全部公开，可维修、可改造、可二次开发。",
      "why.3t": "口袋尺寸", "why.3p": "从掌心电脑到卡片键盘，每件设备都为随身而生。",
      "cta.home.t": "从 TypixDeck 开始", "cta.home.p": "一台能握在手里、静音、开源的铝合金 Linux 电脑。加入 4,200+ 创客。",
      "cta.home.b1": "了解 TypixDeck", "cta.home.b2": "查看全部产品",
      "ft.tag": "小批量设计与铣削的紧凑开源硬件。做得小巧，发往全球。",
      "ft.products": "产品", "ft.company": "公司", "ft.open": "开源",
      "ft.about": "关于", "ft.support": "支持", "ft.shipping": "物流", "ft.warranty": "保修",
      "ft.cad": "CAD 文件", "ft.fw": "固件", "ft.docs": "文档",
      "ft.copy": "© 2026 TypixNode — 紧凑开源硬件",
      "deck.h1": '无风扇 Linux 电脑，<br/><span class="grad">由整块铝材铣削而成。</span>',
      "deck.lead": "认识 TypixDeck——由航空铝整块雕刻、围绕树莓派计算模块打造的静音密封掌心机器。打开它、折腾它、让它成为你的。",
      "deck.add": "加入购物车 →", "deck.look": "看看内部",
      "deck.ship": "· 全球免运费",
      "deck.trust": "现货 · 2–3 天发货 · 两年质保 · 4,200+ 创客",
      "st.fanless": "无风扇", "st.alu": "CNC 铝合金", "st.pi": "树莓派", "st.open": "开源",
      "st.social": "<b>4,200+</b> 创客已在 TypixNode 硬件上开发。",
      "f.kicker": "差异何在", "f.title": "一台小电脑该有的一切",
      "f.sub": "没有会坏的风扇、不会变形的塑料、不被锁住的固件——只有你完全掌控、做工精良的机器。",
      "f.1t": "整体铣削机身", "f.1p": "由整块 6061-T6 铝材雕刻，喷砂阳极氧化处理。坚固、手感冰凉，可用数十年。",
      "f.2t": "真正静音 — 0 dB", "f.2p": "机身即散热片。无风扇、无开孔、无积灰。持续满载依然凉爽且完全静音。",
      "f.3t": "树莓派 CM4 / CM5", "f.3p": "装上你想要的计算模块，日后可升级。",
      "f.4t": "完整接口", "f.4p": "HDMI、USB-C、双 USB-A、以太网、40 针 GPIO。",
      "f.5t": "开源 CAD 与固件", "f.5p": "全部 STEP 文件、原理图与图片都在 GitHub。",
      "f.6t": "银行卡大小", "f.6p": "比手机还小，却比看上去更有分量。塞进包里，随处运行完整 Linux 桌面。",
      "in.kicker": "为打开而设计", "in.title": "四颗螺丝，即可进入内部。",
      "in.1": "<b>易于拆装。</b> 防脱螺丝、标注清晰的接口、配套拆解指南——全程无胶水。",
      "in.2": "<b>更换核心。</b> 计算模块位于标准插座上，几分钟即可升级到 CM5。",
      "in.3": "<b>自由扩展。</b> M.2 NVMe 插槽、40 针 HAT 排针，以及多个内部扩展排针。",
      "in.4": "<b>可修不弃。</b> 备件与 CAD 全部公开，刮花的外壳绝不意味着要买新电脑。",
      "in.git": "在 GitHub 查看 CAD ↗",
      "r.1k": "静音桌面", "r.1t": "一台毫无噪音的完整 Linux 桌面", "r.1p": "直接启动 Raspberry Pi OS 或你喜欢的发行版。编码、SSH、上网、折腾——桌上零风扇噪音。",
      "r.2k": "口袋输入", "r.2t": "与卡片键盘绝配", "r.2p": "搭配 TypixNode 蓝牙键盘，组成完整口袋工作站——全键位、陀螺空中鼠标、白色背光，蓝牙或 USB-C。",
      "r.3k": "为折腾者而生", "r.3t": "激发好奇心的硬件", "r.3p": "从掌心 1984 麦金塔到自焊键盘套件，每件 TypixNode 设备都为可拆、可懂、可改而设计。",
      "lu.kicker": "完整阵容", "lu.title": "四款机器，按需选择。", "lu.sub": "一份精心打造的小目录——没有凑数，每件都是我们自己也会用的产品。",
      "sp.kicker": "TypixDeck", "sp.title": "技术规格",
      "sp.compute": "计算核心", "sp.chassis": "机身", "sp.cooling": "散热", "sp.storage": "存储",
      "sp.ports": "接口", "sp.wireless": "无线", "sp.dim": "尺寸", "sp.os": "开源",
      "sp.compute.v": "树莓派计算模块 4 或 5（插座式）",
      "sp.chassis.v": "CNC 铣削 6061-T6 铝合金，喷砂阳极氧化",
      "sp.cooling.v": "被动散热——机身即散热片，0 dB",
      "sp.storage.v": "microSD + 内置 M.2 NVMe 插槽",
      "sp.ports.v": "HDMI、USB-C（PD）、2× USB-A、千兆以太网、40 针 GPIO",
      "sp.wireless.v": "Wi-Fi 5 / 蓝牙 5.0（取决于计算模块）",
      "sp.dim.v": "95 × 62 × 22 mm · 280 g",
      "sp.os.v": "完整 STEP 文件、原理图与固件均在 GitHub",
      "faq.kicker": "你可能想知道", "faq.title": "常见问题",
      "faq.q1": "是否附带树莓派计算模块？", "faq.a1": "TypixDeck 以机身套件形式发售。可在结账时加购 CM4 或 CM5，也可使用你已有的模块——它采用标准计算模块插座。",
      "faq.q2": "无风扇怎么散热？", "faq.a2": "铝合金一体机身就是散热片。计算模块与机身热耦合，热量铺散到整个机身并静默散出，持续满载也不在话下。",
      "faq.q3": "我真的能自己拆修吗？", "faq.a3": "可以。四颗防脱螺丝、无胶水、标注清晰的接口，以及公开的拆解指南。备件与 CAD 文件均可获取，任意维修或改造。",
      "faq.q4": "是否全球发货？", "faq.a4": "是的——全球免运费，通常 2–3 个工作日备货加承运时效。部分地区可能产生关税。",
      "cta.deck.t": "打造你的口袋 Linux 实验室", "cta.deck.p": "静音、开源、为打开而生。加入 4,200+ 使用 TypixNode 硬件的创客。",
      "cta.deck.b2": "查看全部产品",
      "cart.title": "你的购物车", "cart.empty": "购物车是空的。", "cart.sub": "小计",
      "cart.checkout": "结账", "cart.note": "税费与运费将在结账时计算。", "cart.add": "加入购物车",
      "cart.unavailable": "在线支付正在开通中，请稍后再来。",
      "see.all": "查看全部产品", "look": "看看内部",
      "doc.kb": "蓝牙键盘 — 卡片大小无线键盘 | TypixNode",
      "kb.h1": '一块全键盘，<br/><span class="grad">只有卡片大小。</span>',
      "kb.lead": "口袋大小却功能齐全——完整 QWERTY 布局，内置陀螺仪空中鼠标与清晰白色背光。蓝牙 5.2 或 USB-C，可连手机、平板、电视以及你的 TypixDeck。",
      "kb.s1l": "无线", "kb.s2l": "空中鼠标", "kb.s3l": "重量", "kb.s4l": "充电",
      "kb.row.t": "无需鼠标也能指点", "kb.row.p": "6 轴陀螺仪让整块键盘变成指针——倾斜移动光标，用拇指点击。隔着房间操作电视或 TypixDeck 都很顺手。",
      "kb.feat": "小巧，却样样都行",
      "kb.f1t": "内置空中鼠标", "kb.f1p": "倾斜指点的陀螺指针，外加专用鼠标键——无需平面。",
      "kb.f2t": "背光 · 可充电", "kb.f2p": "清晰白色背光，USB-C 可充电电池，一次充电可用数周。",
      "kb.f3t": "什么都能连", "kb.f3p": "蓝牙 5.2 或有线 USB-C，秒连手机、平板、电视与 TypixDeck。",
      "kb.spk1": "布局", "kb.spv1": "64 键 QWERTY，含功能行",
      "kb.spk2": "指点", "kb.spv2": "6 轴陀螺空中鼠标 + 鼠标键",
      "kb.spk3": "无线", "kb.spv3": "蓝牙 5.2 + USB-C 有线",
      "kb.spk4": "背光", "kb.spv4": "可调白色 LED",
      "kb.spk5": "电池", "kb.spv5": "可充锂聚合物，USB-C",
      "kb.spk6": "尺寸", "kb.spv6": "139 × 78 × 13 mm · 120 g",
      "kb.q1": "它能配什么用？", "kb.a1": "任何支持蓝牙或 USB HID 键盘的设备——手机、平板、智能电视、单板计算机，当然还有 TypixDeck。",
      "kb.q2": "电池能用多久？", "kb.a2": "正常使用一次充电可用数周。通过 USB-C 充电，边充边用也没问题。",
      "kb.cta.t": "给你的套装加把键盘", "kb.cta.p": "TypixDeck 的口袋搭档——卡片机身里塞进全键位、空中鼠标与背光。",
      "doc.diy": "DIY 套件 — 开源键盘焊接套件 | TypixNode",
      "diy.h1": '亲手焊一把<br/><span class="grad">你的键盘。</span>',
      "diy.lead": "一套开源组装套件，用一个下午换来一把你亲手做的键盘。易焊的直插 PCB、图文分步指南，以及令人满足的清脆手感——零基础也能完成。",
      "diy.s1l": "组装时长", "diy.s2l": "按键", "diy.s3l": "固件", "diy.s4l": "开源",
      "diy.row.t": "一个值得的下午", "diy.row.p": "盒里一应俱全——PCB、定位板、轴体、键帽与图文指南。按步骤一步步来，最后收获一把完全属于你的键盘。",
      "diy.feat": "是套件，不是苦差",
      "diy.f1t": "零基础友好", "diy.f1p": "直插焊接、标注清晰的元件与图文指南。会拿烙铁就能做。",
      "diy.f2t": "开源 PCB", "diy.f2p": "完整 PCB 设计与物料清单公开——自由改布局，做成你的样子。",
      "diy.f3t": "QMK 固件", "diy.f3p": "重映射每颗键、添加层与宏，随心调校。",
      "diy.spk1": "布局", "diy.spv1": "48 键 ortholinear",
      "diy.spk2": "PCB", "diy.spv2": "开源，直插式",
      "diy.spk3": "固件", "diy.spv3": "兼容 QMK",
      "diy.spk4": "轴体", "diy.spv4": "兼容热插拔焊盘",
      "diy.spk5": "包含", "diy.spv5": "PCB、定位板、轴体、键帽、指南",
      "diy.spk6": "组装时长", "diy.spv6": "约 2 小时",
      "diy.q1": "需要焊接经验吗？", "diy.a1": "不需要。套件采用对新手友好的直插元件，并附图文分步指南，一把基础烙铁即可。",
      "diy.q2": "可以自定义布局吗？", "diy.a2": "可以。PCB 设计开源、运行 QMK，可重映射按键、添加层与宏，甚至 fork 硬件。",
      "diy.cta.t": "自己动手做一把", "diy.cta.p": "开源 PCB、图文指南与清脆手感——从头到尾完成你的第一把键盘。",
      "doc.mac": "Pico-Mac Nano — 掌心 1984 麦金塔 | TypixNode",
      "mac.h1": '一台 1984 麦金塔，<br/><span class="grad">就在你掌心。</span>',
      "mac.lead": "对初代麦金塔的精巧复刻，而且真能启动经典 Mac OS。USB-C 供电，看着 Happy Mac 出现在清晰的小屏上，运行真正的复古软件。",
      "mac.s1l": "屏幕", "mac.s2l": "启动", "mac.s3l": "重量", "mac.s4l": "供电",
      "mac.row.t": "Happy Mac 重现", "mac.row.p": "不是屏保图片——它会启动一台仿真的经典麦金塔，连那张微笑的脸都在，并在清晰小屏上运行那个年代的软件。",
      "mac.feat": "机器虽小，神韵犹在",
      "mac.f1t": "真启动 Mac OS", "mac.f1p": "在内置屏上运行仿真经典麦金塔系统，Happy Mac 一应俱全。",
      "mac.f2t": "USB-C 供电", "mac.f2p": "无需电池，插上任意 USB-C 口，系统数秒启动。",
      "mac.f3t": "忠实的迷你复刻", "mac.f3p": "复刻 1984 原型，连米色弧线与软驱口都还原——有灵魂的桌面玩物。",
      "mac.spk1": "屏幕", "mac.spv1": "2 英寸，经典黑白界面",
      "mac.spk2": "系统", "mac.spv2": "仿真经典 Mac OS（Happy Mac）",
      "mac.spk3": "供电", "mac.spv3": "USB-C，无内置电池",
      "mac.spk4": "存储", "mac.spv4": "microSD，含系统镜像",
      "mac.spk5": "外壳", "mac.spv5": "注塑成型，忠于 1984",
      "mac.spk6": "尺寸", "mac.spv6": "60 × 44 × 66 mm · 90 g",
      "mac.q1": "真的能跑 Mac OS 吗？", "mac.a1": "能——它在内置屏上启动仿真的经典麦金塔系统，连 Happy Mac 都在，可运行那个年代的软件。",
      "mac.q2": "怎么供电？", "mac.a2": "通过 USB-C。没有内置电池，插上任意 USB-C 电源数秒即可启动。",
      "mac.cta.t": "把 1984 摆上桌", "mac.cta.p": "真能启动的掌心麦金塔——电脑爱好者最迷人的桌面玩物。",
      "about.doc": "关于 — TypixNode", "about.kicker": "我们的故事", "about.h1": "我们只做几样东西，但做到极好。",
      "about.lead": "TypixNode 是一间很小的工作室，小批量地设计、铣削并逐台测试紧凑开源硬件。我们宁愿做四样自己钟爱的东西，也不做四十样无感的产品。",
      "about.believe": "我们的信条", "about.story": "每个盒子里都附公开的 CAD、原理图与固件；小批量、逐台手检；部件可更换。这就是全部理念。",
      "about.v1t": "为打开而造", "about.v1p": "每件产品都附公开 CAD、原理图与固件。既然归你所有，你就该能理解并维修它。",
      "about.v2t": "小批量，高用心", "about.v2p": "我们小批量铣削、组装与测试，每一台出厂前都经人工检查。",
      "about.v3t": "为耐用而生", "about.v3p": "该用金属处用金属，标准插座、可更换部件。值得长久使用的硬件，而非填埋场的垃圾。",
      "support.doc": "支持 — TypixNode", "support.kicker": "帮助与支持", "support.h1": "我们随时为你提供帮助。",
      "support.lead": "物流、退换、保修与设置——要点都在下面。还没解决？给我们发邮件，会有真人回复。",
      "support.s1t": "物流", "support.s1p": "全球免运费。订单 2–3 个工作日发货，时效视地区而定。部分线路可能产生关税。",
      "support.s2t": "退换", "support.s2p": "未使用且原包装完好的商品支持 30 天退货。联系我们，在支持地区会寄出预付标签。",
      "support.s3t": "保修", "support.s3p": "每件设备享两年有限质保，针对制造缺陷。维修使用正品且有据可查的部件。",
      "support.s4t": "联系", "support.s4p": "邮件 hello@typixnode.com——通常一个工作日内回复。",
      "err.title": "页面未找到", "err.text": "你要找的页面被移动、被铣掉，或者从未存在。", "err.btn": "返回首页"
    },
    ja: {
      "doc.home": "TypixNode — コンパクトなオープンハードウェア",
      "doc.deck": "TypixDeck — ファンレス Linux コンピュータ | TypixNode",
      "nav.deck": "TypixDeck", "nav.all": "製品一覧", "nav.tech": "技術",
      "nav.features": "特長", "nav.inside": "内部", "nav.specs": "仕様",
      "nav.faq": "FAQ", "nav.open": "オープン", "nav.buy": "今すぐ購入",
      "hero.badge": "コンパクトなオープンハードウェア · 2026 年設立",
      "home.h1": 'フルなコンピュータを、<br/><span class="grad">手のひらサイズで。</span>',
      "home.lead": "丁寧に作られた小さなマシンの家族——ファンレス削り出しアルミの TypixDeck、カードサイズのキーボード、身につけられる Macintosh。一台ずつ検証、完全オープンソース、世界中へ発送。",
      "home.cta1": "TypixDeck を見る →", "home.cta2": "製品一覧を見る",
      "pin.fanless": "ファンレス · CM5", "pin.stock": "在庫あり", "pin.silent": "完全な静音",
      "save.title": "$100 OFF", "save.sub": "発売価格",
      "prod.kicker": "カタログ", "prod.title": "製品一覧",
      "prod.sub": "4 つのマシン · オープンソース · 世界中へ発送", "prod.scroll": "スクロール",
      "tag.flagship": "フラッグシップ",
      "p.deck.ds": "ラズベリーパイ コンピュートモジュール搭載、ファンレス削り出しアルミの Linux コンピュータ。静音・密閉・オープン。",
      "p.kb.ds": "ジャイロ エアマウスと白色バックライト内蔵のカードサイズ フルキーボード。Bluetooth 5.2 / USB-C。",
      "p.diy.ds": "午後のひとときで自作する 48 キーキーボード。オープンソース PCB と QMK ファームウェア。",
      "p.mac.ds": "1984 年の Macintosh を手のひらサイズに。USB-C 給電で本物のクラシック Mac OS が起動。",
      "why.kicker": "TypixNode を選ぶ理由", "why.title": "小さく、オープンに。",
      "why.1t": "ファンレス・静音", "why.1p": "アルミ削り出しボディがヒートシンクを兼ねる——0 dB でフル性能、壊れるファンなし。",
      "why.2t": "完全オープンソース", "why.2p": "回路図・ファームウェア・STEP ファイルをすべて公開。修理も改造も自由。",
      "why.3t": "ポケットサイズ", "why.3p": "手のひらコンピュータからカードキーボードまで、すべて持ち運ぶために作られています。",
      "cta.home.t": "TypixDeck から始めよう", "cta.home.p": "手のひらに収まる、静かでオープンな削り出しアルミの Linux コンピュータ。4,200+ のメイカーに。",
      "cta.home.b1": "TypixDeck を見る", "cta.home.b2": "製品一覧を見る",
      "ft.tag": "小ロットで設計・削り出すコンパクトなオープンハードウェア。小さく作り、世界へ。",
      "ft.products": "製品", "ft.company": "会社", "ft.open": "オープン",
      "ft.about": "会社概要", "ft.support": "サポート", "ft.shipping": "配送", "ft.warranty": "保証",
      "ft.cad": "CAD ファイル", "ft.fw": "ファームウェア", "ft.docs": "ドキュメント",
      "ft.copy": "© 2026 TypixNode — コンパクトなオープンハードウェア",
      "deck.h1": 'ファンレス Linux コンピュータ、<br/><span class="grad">一塊から削り出し。</span>',
      "deck.lead": "TypixDeck——航空アルミの塊から削り出し、ラズベリーパイ コンピュートモジュールを中心に作られた静音・密閉の手のひらマシン。開けて、いじって、自分のものに。",
      "deck.add": "カートに追加 →", "deck.look": "内部を見る",
      "deck.ship": "· 世界中送料無料",
      "deck.trust": "在庫あり · 2〜3 日で発送 · 2 年保証 · 4,200+ メイカー",
      "st.fanless": "ファンレス", "st.alu": "CNC アルミ", "st.pi": "ラズベリーパイ", "st.open": "オープンソース",
      "st.social": "<b>4,200+</b> のメイカーが TypixNode で開発中。",
      "f.kicker": "違いはここに", "f.title": "小さなコンピュータに必要なすべて",
      "f.sub": "壊れるファンも、たわむ樹脂も、ロックされたファームウェアもなし——あなたが完全に制御できる、美しく作られたマシン。",
      "f.1t": "一体削り出しボディ", "f.1p": "6061-T6 アルミの塊から削り出し、ビーズブラスト＋アルマイト処理。堅牢で冷たく、数十年使える。",
      "f.2t": "完全な静音 — 0 dB", "f.2p": "ボディそのものがヒートシンク。ファンも通気孔も埃もなし。連続フル負荷でも涼しく完全に無音。",
      "f.3t": "ラズベリーパイ CM4 / CM5", "f.3p": "好きなコンピュートモジュールを装着、後から増強も。",
      "f.4t": "充実の I/O", "f.4p": "HDMI、USB-C、USB-A ×2、イーサネット、40 ピン GPIO。",
      "f.5t": "オープンな CAD とファームウェア", "f.5p": "すべての STEP・回路図・画像を GitHub に公開。",
      "f.6t": "カードサイズ", "f.6p": "スマホより小さく、見た目より重い。バッグに滑り込ませ、どこでもフル Linux デスクトップ。",
      "in.kicker": "開けるための設計", "in.title": "ネジ 4 本で内部へ。",
      "in.1": "<b>扱いやすい。</b> 脱落防止ネジ、ラベル付きコネクタ、公開された分解ガイド——接着剤は一切なし。",
      "in.2": "<b>頭脳を交換。</b> コンピュートモジュールは標準ソケット。数分で CM5 へ。",
      "in.3": "<b>拡張自在。</b> NVMe 用 M.2 スロット、HAT 用 40 ピンヘッダ、内部拡張ヘッダ。",
      "in.4": "<b>捨てずに修理。</b> 交換部品と CAD を公開。傷ついた蓋のために新品を買う必要はありません。",
      "in.git": "GitHub で CAD を見る ↗",
      "r.1k": "静音デスクトップ", "r.1t": "音を立てないフル Linux デスクトップ", "r.1p": "Raspberry Pi OS やお好みのディストロを直接起動。コーディング、SSH、ブラウズ——机の上でファン音ゼロ。",
      "r.2k": "ポケット入力", "r.2t": "カードキーボードと好相性", "r.2p": "TypixNode BLE キーボードを加えれば完全なポケット作業環境——フル配列・ジャイロ エアマウス・白色バックライト、Bluetooth / USB-C。",
      "r.3k": "いじる人のために", "r.3t": "好奇心を誘うハードウェア", "r.3p": "手のひらの 1984 Mac から自作キーボードキットまで、すべての TypixNode は開けて・理解し・改造できるよう設計。",
      "lu.kicker": "ラインナップ", "lu.title": "4 つのマシン、サイズで選ぶ。", "lu.sub": "丁寧に作った小さなカタログ——水増しなし、どれも自分で使いたい製品だけ。",
      "sp.kicker": "TypixDeck", "sp.title": "技術仕様",
      "sp.compute": "コンピュート", "sp.chassis": "シャーシ", "sp.cooling": "冷却", "sp.storage": "ストレージ",
      "sp.ports": "ポート", "sp.wireless": "無線", "sp.dim": "寸法", "sp.os": "オープンソース",
      "sp.compute.v": "ラズベリーパイ コンピュートモジュール 4 または 5（ソケット式）",
      "sp.chassis.v": "CNC 削り出し 6061-T6 アルミ、ビーズブラスト＋アルマイト",
      "sp.cooling.v": "パッシブ——ボディがヒートシンク、0 dB",
      "sp.storage.v": "microSD + 内蔵 M.2 NVMe スロット",
      "sp.ports.v": "HDMI、USB-C（PD）、USB-A ×2、ギガビット イーサネット、40 ピン GPIO",
      "sp.wireless.v": "Wi-Fi 5 / Bluetooth 5.0（モジュール依存）",
      "sp.dim.v": "95 × 62 × 22 mm · 280 g",
      "sp.os.v": "STEP・回路図・ファームウェアをすべて GitHub に公開",
      "faq.kicker": "知っておくと便利", "faq.title": "よくある質問",
      "faq.q1": "ラズベリーパイ コンピュートモジュールは付属しますか？", "faq.a1": "TypixDeck はシャーシキットとして販売します。購入時に CM4 / CM5 を追加するか、お手持ちのモジュールを使用できます——標準ソケット対応です。",
      "faq.q2": "ファンレスでどう冷えるの？", "faq.a2": "アルミ一体ボディがヒートシンクです。モジュールがボディと熱結合し、熱が全体に広がって静かに放散——連続フル負荷でも安心です。",
      "faq.q3": "本当に自分で開けて修理できますか？", "faq.a3": "はい。脱落防止ネジ 4 本、接着剤なし、ラベル付きコネクタ、公開の分解ガイド。交換部品と CAD も入手でき、修理も改造も自由です。",
      "faq.q4": "世界中へ発送しますか？", "faq.a4": "はい——世界中送料無料。通常 2〜3 営業日の手配＋輸送期間です。地域により関税がかかる場合があります。",
      "cta.deck.t": "ポケット Linux ラボを作ろう", "cta.deck.p": "静かで、オープンで、開けるために作られた。TypixNode を使う 4,200+ のメイカーに加わろう。",
      "cta.deck.b2": "製品一覧を見る",
      "cart.title": "カート", "cart.empty": "カートは空です。", "cart.sub": "小計",
      "cart.checkout": "レジに進む", "cart.note": "税・送料はレジで計算されます。", "cart.add": "カートに追加",
      "cart.unavailable": "オンライン決済は準備中です。しばらくお待ちください。",
      "see.all": "製品一覧を見る", "look": "内部を見る",
      "doc.kb": "BLE キーボード — カードサイズのワイヤレスキーボード | TypixNode",
      "kb.h1": 'フルキーボードを、<br/><span class="grad">カードサイズで。</span>',
      "kb.lead": "ポケットサイズなのに本格派——フル QWERTY 配列に、ジャイロ エアマウスと白色バックライトを内蔵。Bluetooth 5.2 / USB-C でスマホ・タブレット・TV・TypixDeck に接続。",
      "kb.s1l": "無線", "kb.s2l": "エアマウス", "kb.s3l": "重量", "kb.s4l": "充電",
      "kb.row.t": "マウスなしでポインティング", "kb.row.p": "6 軸ジャイロでキーボード全体がポインタに——傾けてカーソルを動かし、親指でクリック。TV や離れた TypixDeck の操作に最適。",
      "kb.feat": "小さくても、何でもこなす",
      "kb.f1t": "エアマウス内蔵", "kb.f1p": "傾けて操作するジャイロポインタと専用マウスキー——平面いらず。",
      "kb.f2t": "バックライト・充電式", "kb.f2p": "鮮明な白色バックライトと、数週間もつ USB-C 充電池。",
      "kb.f3t": "何にでもつながる", "kb.f3p": "Bluetooth 5.2 / 有線 USB-C。スマホ・タブレット・TV・TypixDeck に即ペアリング。",
      "kb.spk1": "配列", "kb.spv1": "64 キー QWERTY（ファンクション行付き）",
      "kb.spk2": "ポインティング", "kb.spv2": "6 軸ジャイロ エアマウス + マウスキー",
      "kb.spk3": "無線", "kb.spv3": "Bluetooth 5.2 + USB-C 有線",
      "kb.spk4": "バックライト", "kb.spv4": "調光できる白色 LED",
      "kb.spk5": "バッテリー", "kb.spv5": "充電式 Li-Po、USB-C",
      "kb.spk6": "寸法", "kb.spv6": "139 × 78 × 13 mm · 120 g",
      "kb.q1": "何に使えますか？", "kb.a1": "Bluetooth または USB HID キーボードに対応するもの全般——スマホ、タブレット、スマート TV、シングルボードコンピュータ、そしてもちろん TypixDeck。",
      "kb.q2": "バッテリーはどのくらい？", "kb.a2": "通常使用で 1 回の充電につき数週間。USB-C で充電でき、充電しながら使えます。",
      "kb.cta.t": "キットにキーボードを", "kb.cta.p": "TypixDeck のポケット相棒——カードサイズにフル配列・エアマウス・バックライト。",
      "doc.diy": "DIY スイート — オープンソースのキーボード自作キット | TypixNode",
      "diy.h1": '自分で組む<br/><span class="grad">キーボード。</span>',
      "diy.lead": "午後のひとときで「自分で作ったキーボード」に変わるオープンソース キット。はんだ付けしやすいスルーホール PCB、図解の手順書、心地よいクリック感——経験は不要。",
      "diy.s1l": "組立時間", "diy.s2l": "キー数", "diy.s3l": "ファームウェア", "diy.s4l": "オープンソース",
      "diy.row.t": "よく使えた午後", "diy.row.p": "箱の中にすべて——PCB、プレート、スイッチ、キーキャップ、図解ガイド。手順どおり進めれば、完全に自分だけの一台に。",
      "diy.feat": "作業じゃなく、キット",
      "diy.f1t": "初心者にやさしい", "diy.f1p": "スルーホールはんだ付け、ラベル付き部品、図解ガイド。はんだごてを持てれば作れます。",
      "diy.f2t": "オープンソース PCB", "diy.f2p": "PCB 設計と部品表を公開——配列を改変して自分仕様に。",
      "diy.f3t": "QMK ファームウェア", "diy.f3p": "全キーを再マップ、レイヤーやマクロを追加し、思いどおりに調整。",
      "diy.spk1": "配列", "diy.spv1": "48 キー オーソリニア",
      "diy.spk2": "PCB", "diy.spv2": "オープンソース、スルーホール",
      "diy.spk3": "ファームウェア", "diy.spv3": "QMK 対応",
      "diy.spk4": "スイッチ", "diy.spv4": "ホットスワップ対応フットプリント",
      "diy.spk5": "同梱", "diy.spv5": "PCB、プレート、スイッチ、キーキャップ、ガイド",
      "diy.spk6": "組立時間", "diy.spv6": "約 2 時間",
      "diy.q1": "はんだ付けの経験は必要？", "diy.a1": "いいえ。初心者向けのスルーホール部品を使い、図解の手順書が付属。基本的なはんだごてがあれば十分です。",
      "diy.q2": "配列をカスタムできますか？", "diy.a2": "はい。PCB 設計はオープンソースで QMK 動作。キーの再マップ、レイヤーやマクロ追加、ハードの fork まで可能です。",
      "diy.cta.t": "自分で作ろう", "diy.cta.p": "オープン PCB、図解ガイド、心地よいクリック——最初の一台を最後まで。",
      "doc.mac": "Pico-Mac Nano — 手のひらサイズの 1984 Macintosh | TypixNode",
      "mac.h1": '1984 年の Macintosh を、<br/><span class="grad">手のひらに。</span>',
      "mac.lead": "初代 Macintosh の愛すべきミニチュア。しかも本当にクラシック Mac OS が起動。USB-C で給電し、鮮明な小型ディスプレイに Happy Mac が現れ、当時のソフトが動きます。",
      "mac.s1l": "ディスプレイ", "mac.s2l": "起動", "mac.s3l": "重量", "mac.s4l": "電源",
      "mac.row.t": "Happy Mac、再び", "mac.row.p": "画面の写真ではありません——エミュレートされたクラシック Macintosh が、あの笑顔ごと起動し、小さく鮮明な画面で当時のソフトを動かします。",
      "mac.feat": "小さなマシン、本物の魂",
      "mac.f1t": "本物の Mac OS が起動", "mac.f1p": "内蔵ディスプレイで、Happy Mac を含むエミュレート版クラシック Macintosh システムが動作。",
      "mac.f2t": "USB-C 給電", "mac.f2p": "電池不要——任意の USB-C ポートに挿せば数秒でシステムが起動。",
      "mac.f3t": "忠実なミニチュア", "mac.f3p": "ベージュの曲線やフロッピー口まで 1984 年の原型に忠実——魂のあるデスクトイ。",
      "mac.spk1": "ディスプレイ", "mac.spv1": "2 インチ、クラシックな白黒 UI",
      "mac.spk2": "システム", "mac.spv2": "エミュレート版クラシック Mac OS（Happy Mac）",
      "mac.spk3": "電源", "mac.spv3": "USB-C、内蔵電池なし",
      "mac.spk4": "ストレージ", "mac.spv4": "microSD（システムイメージ入り）",
      "mac.spk5": "ボディ", "mac.spv5": "射出成形、1984 年に忠実",
      "mac.spk6": "寸法", "mac.spv6": "60 × 44 × 66 mm · 90 g",
      "mac.q1": "本当に Mac OS が動くの？", "mac.a1": "はい——内蔵ディスプレイで Happy Mac を含むエミュレート版クラシック Macintosh システムが起動し、当時のソフトを動かせます。",
      "mac.q2": "電源は？", "mac.a2": "USB-C です。内蔵電池はなく、任意の USB-C 電源に挿せば数秒で起動します。",
      "mac.cta.t": "1984 を机の上に", "mac.cta.p": "本当に起動する手のひら Macintosh——コンピュータ好きに最も魅力的なデスクトイ。",
      "about.doc": "会社概要 — TypixNode", "about.kicker": "私たちの物語", "about.h1": "少数の製品を、とことん丁寧に。",
      "about.lead": "TypixNode は、コンパクトなオープンハードウェアを小ロットで設計・削り出し・検証する小さなスタジオです。愛せない 40 個より、愛せる 4 個を作りたい。",
      "about.believe": "私たちの信条", "about.story": "すべての箱に公開 CAD・回路図・ファームウェア。小ロットで手検査し、部品は交換可能。それが全ての考え方です。",
      "about.v1t": "開けるために作る", "about.v1p": "すべての製品に公開 CAD・回路図・ファームウェアを同梱。所有するなら、理解し修理できるべきです。",
      "about.v2t": "小ロット、高い丁寧さ", "about.v2p": "小ロットで削り出し・組立・検証。出荷前に一台ずつ手で確認します。",
      "about.v3t": "長く使えるように", "about.v3p": "必要な所に金属、標準ソケット、交換可能な部品。埋立ごみではなく、長寿命のハードウェア。",
      "support.doc": "サポート — TypixNode", "support.kicker": "ヘルプ＆サポート", "support.h1": "お手伝いします。",
      "support.lead": "配送・返品・保証・セットアップ——要点は以下に。解決しない場合はメールを。人間が返信します。",
      "support.s1t": "配送", "support.s1p": "世界中送料無料。2〜3 営業日で発送、輸送時間は地域により異なります。一部経路で関税が発生する場合があります。",
      "support.s2t": "返品", "support.s2p": "未使用・元の梱包であれば 30 日以内の返品可。ご連絡いただければ、対応地域では着払いラベルをお送りします。",
      "support.s3t": "保証", "support.s3p": "全機に製造上の欠陥に対する 2 年限定保証。修理には正規で文書化された部品を使用します。",
      "support.s4t": "お問い合わせ", "support.s4p": "メール hello@typixnode.com——通常 1 営業日以内に返信します。",
      "err.title": "ページが見つかりません", "err.text": "お探しのページは移動・削り出し済み、または最初から存在しません。", "err.btn": "ホームへ戻る"
    }
  };

  function L(key, lang) {
    var d = I18N[lang] || I18N.en;
    return d[key] != null ? d[key] : (I18N.en[key] != null ? I18N.en[key] : key);
  }

  /* ---------- state ---------- */
  function get(k, def) { try { return localStorage.getItem(k) || def; } catch (e) { return def; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var lang = get("tnx-lang", (navigator.language || "en").slice(0, 2));
  if (!I18N[lang]) lang = "en";
  var cur = get("tnx-cur", "USD"); if (!CUR[cur]) cur = "USD";

  /* ---------- apply i18n ---------- */
  function applyI18n() {
    document.documentElement.lang = lang;
    var titleKey = document.body.dataset.titleKey;
    if (titleKey) document.title = L(titleKey, lang);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.innerHTML = L(el.dataset.i18n, lang);
    });
    var ls = document.getElementById("langsel"); if (ls) ls.value = lang;
    renderCart();
  }

  /* ---------- apply currency ---------- */
  function applyCurrency() {
    document.querySelectorAll("[data-usd]").forEach(function (el) {
      el.textContent = money(parseFloat(el.dataset.usd), cur);
    });
    var cs = document.getElementById("cursel"); if (cs) cs.value = cur;
    renderCart();
  }

  /* ---------- theme ---------- */
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    set("tnx-theme", t);
    document.querySelectorAll(".themebtn .ti").forEach(function (e) { e.textContent = t === "dark" ? "☀" : "☾"; });
  }

  /* ---------- cart ---------- */
  function loadCart() { try { return JSON.parse(localStorage.getItem("tnx-cart") || "[]"); } catch (e) { return []; } }
  function saveCart(c) { set("tnx-cart", JSON.stringify(c)); }
  function cartCount() { return loadCart().reduce(function (n, i) { return n + i.qty; }, 0); }
  function addToCart(id) {
    if (!PRODUCTS[id]) return;
    var c = loadCart(), f = c.find(function (i) { return i.id === id; });
    if (f) f.qty++; else c.push({ id: id, qty: 1 });
    saveCart(c); renderCart(); openCart(); renderPayPal();
  }
  function setQty(id, d) {
    var c = loadCart(), f = c.find(function (i) { return i.id === id; });
    if (!f) return; f.qty += d; if (f.qty <= 0) c = c.filter(function (i) { return i.id !== id; });
    saveCart(c); renderCart();
  }
  function removeItem(id) { saveCart(loadCart().filter(function (i) { return i.id !== id; })); renderCart(); }

  function renderCart() {
    var c = loadCart();
    document.querySelectorAll(".cartbtn .cc").forEach(function (e) { e.textContent = cartCount(); });
    var box = document.getElementById("cartItems"); if (!box) return;
    if (!c.length) { box.innerHTML = '<div class="empty">' + L("cart.empty", lang) + "</div>"; }
    else {
      box.innerHTML = c.map(function (i) {
        var p = PRODUCTS[i.id]; if (!p) return "";
        return '<div class="ci"><div class="cimg"><img src="' + p.img + '" alt=""></div>' +
          '<div><div class="nm">' + p.name[lang] + '</div><div class="pr">' + money(p.usd, cur) + '</div>' +
          '<button class="rm" data-rm="' + i.id + '">' + (lang === "zh" ? "移除" : lang === "ja" ? "削除" : "Remove") + '</button></div>' +
          '<div class="qty"><button data-dec="' + i.id + '">−</button><span>' + i.qty + '</span><button data-inc="' + i.id + '">+</button></div></div>';
      }).join("");
    }
    var sub = c.reduce(function (n, i) { var p = PRODUCTS[i.id]; return n + (p ? p.usd * i.qty : 0); }, 0);
    var st = document.getElementById("cartSub"); if (st) st.textContent = money(sub, cur);
    // toggle checkout controls by cart emptiness + which providers are enabled
    var empty = !c.length;
    var cfg = window.TNX_CFG || {};
    var stripeOn = !!cfg.stripeEnabled;          // Stripe disabled by default
    var paypalOn = !!cfg.paypalClientId;         // PayPal shown when configured
    var cb = document.getElementById("checkoutBtn");
    if (cb) cb.style.display = (!empty && stripeOn) ? "block" : "none";
    var pw = document.getElementById("paypalWrap"); if (pw) pw.style.display = empty ? "none" : "block";
    var cn = document.getElementById("cartNote"); if (cn) cn.style.display = empty ? "none" : "block";
    // If nothing is configured, tell the user instead of showing a dead cart.
    var err = document.getElementById("cartErr");
    if (err && !empty && !stripeOn && !paypalOn) {
      err.textContent = L("cart.unavailable", lang);
      err.style.display = "block";
    } else if (err && (stripeOn || paypalOn)) {
      // don't clobber a real error message
      if (err.dataset.kind !== "error") { err.textContent = ""; err.style.display = "none"; }
    }
  }
  function openCart() { var o = document.getElementById("cartOv"), d = document.getElementById("cartDrawer"); if (o) o.classList.add("on"); if (d) d.classList.add("on"); }
  function closeCart() { var o = document.getElementById("cartOv"), d = document.getElementById("cartDrawer"); if (o) o.classList.remove("on"); if (d) d.classList.remove("on"); }

  /* ---------- checkout ---------- */
  function cartPayload() {
    return { items: loadCart().map(function (i) { return { id: i.id, qty: i.qty }; }), locale: lang };
  }
  function showCartErr(msg) {
    var e = document.getElementById("cartErr");
    if (e) {
      e.textContent = msg || "";
      e.style.display = msg ? "block" : "none";
      e.dataset.kind = msg ? "error" : "";
    }
  }
  // Stripe: POST /api/checkout -> redirect to hosted checkout
  // Disabled by default (window.TNX_CFG.stripeEnabled). Retained for future
  // re-enable once a Stripe-eligible (e.g. HK) entity is available.
  function stripeCheckout() {
    var cfg = window.TNX_CFG || {};
    if (!cfg.stripeEnabled) return;
    var cart = loadCart();
    if (!cart.length) return;
    var btn = document.getElementById("checkoutBtn");
    if (btn) { btn.disabled = true; btn.dataset.busy = "1"; }
    showCartErr("");
    fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cartPayload())
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.url) { location.href = d.url; }
      else { showCartErr((d && d.error) || "Checkout failed."); if (btn) btn.disabled = false; }
    }).catch(function () { showCartErr("Network error."); if (btn) btn.disabled = false; });
  }
  // PayPal: render buttons into #paypalWrap if SDK + client id present
  var paypalRendered = false;
  function renderPayPal() {
    var wrap = document.getElementById("paypalWrap");
    var cfg = window.TNX_CFG || {};
    if (!wrap || paypalRendered || !window.paypal || !cfg.paypalClientId) return;
    if (!loadCart().length) return;
    paypalRendered = true;
    window.paypal.Buttons({
      style: { layout: "horizontal", height: 40, tagline: false },
      createOrder: function () {
        return fetch("/api/paypal/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cartPayload())
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (d && d.id) return d.id;
          throw new Error((d && d.error) || "create failed");
        });
      },
      onApprove: function (data) {
        return fetch("/api/paypal/capture", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderID: data.orderID })
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (d && d.status === "COMPLETED") {
            saveCart([]);
            location.href = "/success?provider=paypal" + (d.orderId ? "&order=" + d.orderId : "");
          } else { showCartErr("Payment not completed."); }
        });
      },
      onError: function () { showCartErr("PayPal error. Try card checkout."); }
    }).render("#paypalWrap");
  }

  /* ---------- wire up ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var qs = new URLSearchParams(location.search);
    if (qs.get("lang") && I18N[qs.get("lang")]) lang = qs.get("lang");
    if (qs.get("cur") && CUR[qs.get("cur")]) cur = qs.get("cur");
    var qt = qs.get("theme");
    applyTheme(qt || document.documentElement.dataset.theme || get("tnx-theme", "light"));
    applyI18n();
    applyCurrency();

    var ls = document.getElementById("langsel");
    if (ls) ls.addEventListener("change", function () { lang = ls.value; set("tnx-lang", lang); applyI18n(); applyCurrency(); });
    var cs = document.getElementById("cursel");
    if (cs) cs.addEventListener("change", function () { cur = cs.value; set("tnx-cur", cur); applyCurrency(); });

    document.querySelectorAll(".themebtn").forEach(function (b) {
      b.addEventListener("click", function () { applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); });
    });

    var burger = document.getElementById("burger"), mob = document.getElementById("mobnav");
    if (burger && mob) burger.addEventListener("click", function () { mob.classList.toggle("on"); });

    document.querySelectorAll(".qa button").forEach(function (b) {
      b.addEventListener("click", function () { b.parentElement.classList.toggle("open"); });
    });

    document.body.addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]");
      if (add) { e.preventDefault(); addToCart(add.dataset.add); return; }
      if (e.target.closest(".cartbtn")) { e.preventDefault(); openCart(); renderPayPal(); return; }
      if (e.target.closest("#checkoutBtn")) { e.preventDefault(); stripeCheckout(); return; }
      if (e.target.id === "cartOv" || e.target.closest("[data-cart-close]")) { closeCart(); return; }
      var inc = e.target.closest("[data-inc]"); if (inc) { setQty(inc.dataset.inc, 1); return; }
      var dec = e.target.closest("[data-dec]"); if (dec) { setQty(dec.dataset.dec, -1); return; }
      var rm = e.target.closest("[data-rm]"); if (rm) { removeItem(rm.dataset.rm); return; }
    });
  });
})();
