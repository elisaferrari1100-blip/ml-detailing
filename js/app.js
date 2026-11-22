(() => {
  const site = window.ML_SITE;
  if (!site) return;

  const ALL = "Все";
  const priceMap = new Map(site.priceList.map((item) => [item.key, item]));
  const groups = [...new Set(site.priceList.map((item) => item.group))];

  const state = {
    selected: [],
    category: ALL,
    serviceHover: null,
    serviceOpenDesktop: null,
    serviceOpenTouch: null,
    form: { name: "", phone: "", car: "", consent: false },
    formTried: false,
    formSending: false,
    formDone: false,
    reviewOpen: {},
    mapUnlocked: false,
    baTouched: {},
  };

  const ICONS = {
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevrons-left-right": '<path d="m9 7-5 5 5 5"/><path d="m15 7 5 5-5 5"/>',
    "circle-check": '<circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "map-pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.904l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  };

  function icon(name, className = "size-4", extra = "") {
    const fill = extra.includes("fill-") || extra.includes("fill=") ? 'fill="currentColor"' : 'fill="none"';
    return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ${fill} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  function brandMark(sizeClass = "brand-mark") {
    const src = site.brand.logoMark || "./brand/logo-flat-v9-mark.webp";
    const fallback = site.brand.logoMarkPng || "./brand/logo-flat-v9-mark.png";
    return `<picture>
      <source type="image/webp" srcset="${esc(src)}">
      <img class="${sizeClass}" src="${esc(fallback)}" width="59" height="40" alt="${esc(site.brand.name)} — детейлинг">
    </picture>`;
  }

  function assetUrl(rel) {
    return new URL(rel, document.baseURI).href;
  }

  function cssUrl(rel) {
    return `url("${assetUrl(rel)}")`;
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPrice(n) {
    return `${n.toLocaleString("ru-RU").replace(/\s/g, "\u00a0")}\u00a0₽`;
  }

  function selectedItems() {
    return state.selected.map((key) => priceMap.get(key)).filter(Boolean);
  }

  function booking() {
    const items = selectedItems();
    return {
      items,
      total: items.reduce((sum, item) => sum + (item.price ?? 0), 0),
      hasOnRequest: items.some((item) => item.price === undefined),
      isSelected: (key) => state.selected.includes(key),
    };
  }

  function toggleItem(key) {
    if (!priceMap.has(key)) return;
    const i = state.selected.indexOf(key);
    if (i >= 0) state.selected.splice(i, 1);
    else state.selected.push(key);
    refreshBooking();
    refreshServicesChrome();
  }

  function removeItem(key) {
    state.selected = state.selected.filter((k) => k !== key);
    refreshBooking();
    refreshServicesChrome();
  }

  function clearItems() {
    state.selected = [];
    refreshBooking();
    refreshServicesChrome();
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isTouch() {
    return window.matchMedia("(hover: none), (pointer: coarse)").matches;
  }

  function isSplit() {
    return window.matchMedia("(min-width: 900px)").matches && !isTouch();
  }

  function applyTheme() {
    const root = document.documentElement;
    const t = site.theme;
    root.style.setProperty("--color-amber", t.accent);
    root.style.setProperty("--color-amber-light", t.accentLight);
    root.style.setProperty("--color-amber-deep", t.accentDeep);
    root.style.setProperty("--color-obsidian", t.background);
    root.style.setProperty("--color-graphite", t.surface);
    root.style.setProperty("--font-display", site.fonts.display);
    root.style.setProperty("--font-sans", site.fonts.sans);
  }

  function btn({ variant = "primary", arrow = false, href, className = "", attrs = "", children, type = "button" }) {
    const cls = `btn btn-${variant} ${className}`.trim();
    const inner = `<span class="relative inline-flex items-center gap-2">${children}</span>${
      arrow && variant !== "icon" ? icon("arrow-right", "btn-arrow relative size-4") : ""
    }`;
    if (href) return `<a class="${cls}" href="${esc(href)}" ${attrs}>${inner}</a>`;
    return `<button type="${type}" class="${cls}" ${attrs}>${inner}</button>`;
  }

  function picture({ src, srcSmall, alt, width, height, className = "", imgClass = "", decorative = false, eager = false }) {
    const altAttr = decorative ? 'alt=""' : `alt="${esc(alt || "")}"`;
    const source = srcSmall ? `<source media="(max-width: 767px)" srcset="${esc(srcSmall)}">` : "";
    return `<picture class="${className}">
      ${source}
      <img src="${esc(src)}" ${altAttr} width="${width}" height="${height}" loading="${eager ? "eager" : "lazy"}" decoding="${eager ? "sync" : "async"}" class="block h-full w-full object-cover ${imgClass}" draggable="false">
    </picture>`;
  }

  function heading({ eyebrow, title, lead, id, className = "", leadClass = "mt-5" }) {
    return `<header class="max-w-3xl ${className}">
      ${eyebrow ? `<p class="eyebrow mb-4">${esc(eyebrow)}</p>` : ""}
      <h2 id="${id}" class="display text-[clamp(24px,3.6vw,46px)] font-semibold text-ink">${esc(title)}</h2>
      ${lead ? `<p class="${leadClass} text-base leading-relaxed text-chrome md:text-lg">${esc(lead)}</p>` : ""}
    </header>`;
  }

  function backdrop(name, strength, position = "center") {
    return `<div aria-hidden="true" class="section-backdrop" style="--backdrop-image:${cssUrl(`./images/backdrops/${name}.webp`)};--backdrop-strength:${strength};--backdrop-position:${position}"></div>`;
  }

  function stripTrack(items) {
    return `<div aria-hidden="true" class="flex shrink-0 items-center">${items
      .map((word) => `<span class="strip-word">${esc(word)}</span><span class="strip-sep">✦</span>`)
      .join("")}</div>`;
  }

  function textStrip(items, tone = "dark") {
    const unique = [...new Set(items)].join(", ");
    const motion = reducedMotion() ? "" : "animate-marquee-left";
    const copy = reducedMotion() ? stripTrack(items) : `${stripTrack(items)}${stripTrack(items)}`;
    return `<div data-tone="${tone}" class="text-strip">
      <p class="sr-only">${esc(unique)}</p>
      <div class="flex w-max ${motion}" style="--marquee-duration:40s">${copy}</div>
    </div>`;
  }

  function workCard(card, decorative) {
    return `<li ${decorative ? 'aria-hidden="true"' : ""} class="shrink-0 pr-4 md:pr-6">
      <article class="work-card group relative aspect-[16/10] w-[clamp(280px,30vw,460px)] overflow-hidden rounded-2xl border border-white/[0.08] bg-graphite">
        ${picture({ src: card.src, srcSmall: card.srcSmall, alt: card.alt, width: card.width, height: card.height, className: "block h-full w-full", imgClass: "work-card-img transition-transform duration-700 ease-out", decorative })}
        <div aria-hidden="true" class="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/65"></div>
        <span class="work-badge glass absolute bottom-3 left-3 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-ink transition-colors duration-300 md:text-[13px]">${esc(card.badge)}</span>
      </article>
    </li>`;
  }

  function worksRow(cards, direction, label) {
    const motion = !reducedMotion();
    const list = cards.map((c) => workCard(c, false)).join("");
    const dup = motion ? cards.map((c) => workCard(c, true)).join("") : "";
    return `<div class="works-row works-marquee" data-works-dir="${direction === "backward" ? "backward" : "forward"}" aria-label="${esc(label)}" tabindex="0">
      <ul class="works-marquee-track m-0 flex list-none p-0 w-max">${list}${dup}</ul>
    </div>`;
  }

  function heroCSSVars() {
    const { narrow: n, wide: w } = site.hero;
    const words = site.brand.heroWords;
    const fit = n.width / n.height >= 0.9;
    const style = [
      `--ar-n:${n.width / n.height}`,
      `--fx-n:${n.focusX}`,
      `--fy-n:${n.focusY}`,
      `--ty-n:${n.textTop}`,
      `--fs-n:${n.textSize}`,
      `--ar-w:${w.width / w.height}`,
      `--fx-w:${w.focusX}`,
      `--fy-w:${w.focusY}`,
      `--ty-w:${w.textTop}`,
      `--fs-w:${w.textSize}`,
      `--chars-line:${words.join(" ").length}`,
      `--chars-word:${Math.max(...words.map((wrd) => wrd.length))}`,
      `--lines:${words.length}`,
      n.carTop != null ? `--ct-n:${n.carTop}` : null,
      `--fill:${cssUrl(n.bg)}`,
    ]
      .filter(Boolean)
      .join(";");
    return { style, fit };
  }

  function renderHero() {
    const { narrow: n, wide: w } = site.hero;
    const { style, fit } = heroCSSVars();
    const markWebp = site.brand.logoMark || "./brand/logo-flat-v9-mark.webp";
    const markPng = site.brand.logoMarkPng || "./brand/logo-flat-v9-mark.png";
    const wordmark = site.brand.heroWordmark || "DETAILING";
    const hasCarLayer = Boolean(n.car && w.car);
    const wideBg = `(min-width: 2000px), (min-width: 1300px) and (min-resolution: 1.5dppx)`;
    const carLayer = hasCarLayer
      ? `<picture>
          <source media="${wideBg}" srcset="${esc(w.car4k || w.car)}">
          <source media="(min-width: 768px)" srcset="${esc(w.car)}">
          <img src="${esc(n.car)}" alt="${esc(n.alt)}" width="${n.width}" height="${n.height}" loading="eager" decoding="sync" class="hero-layer hero-car">
        </picture>`
      : "";
    return `<section id="hero" aria-labelledby="hero-title" class="hero relative overflow-hidden bg-obsidian" data-cutout="${hasCarLayer ? "true" : "false"}" data-fit="${fit}" style="${style}">
      <div aria-hidden="true" class="hero-fill"></div>
      <div class="hero-frame">
        <picture>
          <source media="${wideBg}" srcset="${esc(w.bg4k || w.bg)}">
          <source media="(min-width: 768px)" srcset="${esc(w.bg)}">
          <img src="${esc(n.bg)}" alt="${esc(n.alt || "")}" aria-hidden="${n.alt ? "false" : "true"}" width="${n.width}" height="${n.height}" loading="eager" decoding="sync" class="hero-layer">
        </picture>
        ${carLayer}
      </div>
      <div class="hero-brand">
        <h1 id="hero-title" class="sr-only">ML Detailing</h1>
        <div class="hero-lockup" aria-hidden="true">
          <picture class="hero-mark-wrap">
            <source type="image/webp" srcset="${esc(markWebp)}">
            <img class="hero-mark" src="${esc(markPng)}" alt="" width="320" height="223" decoding="sync" fetchpriority="high">
          </picture>
          <p class="hero-wordmark">${esc(wordmark)}</p>
        </div>
        <p class="hero-kicker">${esc(site.brand.kicker)}</p>
      </div>
      <div aria-hidden="true" class="hero-fade"></div>
      <a href="#works" data-smooth-scroll aria-label="Прокрутить к работам" class="hero-scroll-arrow absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
        ${icon("chevron-down", "size-6")}
      </a>
    </section>`;
  }

  function renderHeader() {
    const links = site.nav
      .map(
        (item) =>
          `<li><a href="${esc(item.href)}" class="header-nav-link">${esc(item.label)}</a></li>`
      )
      .join("");
    const mobileLinks = site.nav
      .map(
        (item) =>
          `<li><a href="${esc(item.href)}" class="header-mobile-link">${esc(item.label)}</a></li>`
      )
      .join("");
    return `<header id="site-header">
      <div class="container-x header-inner">
        <div class="glass header-bar flex items-center justify-between gap-4 rounded-full py-2 pl-3 pr-2 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]">
          <a href="#hero" class="brand-lockup" aria-label="${esc(site.brand.name)} — на главную">
            ${brandMark()}
            <span class="brand-name">${esc(site.brand.name)}</span>
          </a>
          <nav aria-label="Разделы" class="header-nav hidden lg:block">
            <ul class="m-0 flex list-none gap-1 p-0">${links}</ul>
          </nav>
          <div class="header-actions">
            ${btn({ variant: "primary", href: "#request", className: "!min-h-11 !px-5 !text-[13px]", children: "Записаться" })}
            <button type="button" class="header-menu-btn lg:hidden" id="header-menu-btn" aria-expanded="false" aria-controls="header-nav-mobile" aria-label="Открыть меню">
              ${icon("menu", "size-5 header-menu-icon")}
              ${icon("x", "size-5 header-menu-close")}
            </button>
          </div>
        </div>
        <nav id="header-nav-mobile" class="header-mobile-nav lg:hidden" hidden>
          <ul class="m-0 list-none p-0">${mobileLinks}</ul>
        </nav>
      </div>
    </header>`;
  }

  function formatStat(value, decimals = 0) {
    return value.toFixed(decimals);
  }

  function renderAboutStatCards() {
    return site.stats
      .map((stat) => {
        const suffix = stat.suffix ?? "";
        const parts = suffix.split("★");
        return `<li class="about-stat about-stat--compact about-stat--bar glass rounded-full px-4 py-2.5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-amber/40 hover:shadow-[0_8px_28px_-12px_rgba(229,184,105,0.35)] sm:px-4 sm:py-3">
          <div class="about-stat-bar flex w-full min-w-0 items-center justify-between gap-2">
            <p class="display shrink-0 text-[clamp(17px,2vw,22px)] font-semibold leading-none text-ink">
              <span class="sr-only">${formatStat(stat.value, stat.decimals ?? 0)}${suffix}</span>
              <span aria-hidden="true"><span data-stat="${esc(stat.key)}" data-value="${stat.value}" data-decimals="${stat.decimals ?? 0}">${formatStat(0, stat.decimals ?? 0)}</span>${esc(parts[0])}${
          parts[1] !== undefined ? `<span class="text-amber">★${esc(parts[1])}</span>` : ""
        }</span>
            </p>
            <p class="min-w-0 text-right text-[10px] font-semibold leading-snug text-chrome sm:text-[11px]">${esc(stat.label)}</p>
          </div>
          <p class="sr-only">${esc(stat.description)}</p>
        </li>`;
      })
      .join("");
  }

  function renderAboutMapBlock() {
    const c = site.contacts;
    const vk = site.social && site.social.vk;
    const mapLabel = c.yandexOrgUrl.includes("yandex") ? "Открыть в Яндекс Картах" : "Открыть на карте";
    const tel = c.phone.replace(/[^\d+]/g, "");
    const overlay = isTouch() && !state.mapUnlocked
      ? `<button type="button" data-unlock-map class="absolute inset-0 z-[1] flex items-end justify-center bg-transparent pb-5"><span class="glass rounded-full px-4 py-2 text-sm text-ink">Нажмите, чтобы двигать карту</span></button>`
      : "";
    return `<div class="about-intro-aside flex min-w-0 flex-col gap-4 sm:gap-5">
      <div class="map-frame about-map about-map--intro relative min-h-[240px] w-full min-w-0 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-graphite sm:min-h-[300px] lg:min-h-[320px]">
        <iframe src="${esc(c.yandexWidgetUrl)}" title="${esc(site.brand.name)} на картах" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen class="absolute inset-0 h-full w-full border-0"></iframe>
        ${overlay}
        <div class="glass pointer-events-none absolute left-4 top-4 z-[2] flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink">
          <span class="size-2 rounded-full bg-amber" aria-hidden="true"></span>${esc(c.studioName)}
        </div>
      </div>
      <div class="about-map-meta text-[14px] leading-relaxed text-ink sm:text-[15px]" aria-label="${esc(site.sections.location.title)}">
        <p class="about-map-meta-addr m-0 flex items-start gap-3">
          ${icon("map-pin", "mt-0.5 size-5 shrink-0 text-amber")}
          <span>${esc(c.address)}</span>
        </p>
        <p class="about-map-meta-line m-0 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span class="inline-flex items-center gap-2">
            ${icon("clock", "size-5 shrink-0 text-amber")}
            <span>${esc(c.schedule)}${esc(c.scheduleNote)}</span>
          </span>
          <span class="inline-flex items-center gap-2">
            ${icon("phone", "size-5 shrink-0 text-amber")}
            <a href="tel:${esc(tel)}" class="underline-offset-4 hover:text-amber hover:underline">${esc(c.phone)}</a>
          </span>
        </p>
      </div>
      <div class="about-map-actions flex flex-nowrap gap-2 sm:gap-2.5">
        ${btn({ arrow: true, href: "#request", className: "about-map-btn", children: "Записаться" })}
        ${btn({ variant: "glass", arrow: true, href: c.yandexOrgUrl, className: "about-map-btn", attrs: 'target="_blank" rel="noopener noreferrer"', children: mapLabel })}
        ${
          vk && vk.url
            ? btn({
                variant: "glass",
                arrow: true,
                href: vk.url,
                className: "about-map-btn",
                attrs: 'target="_blank" rel="noopener noreferrer me"',
                children: "Открыть в ВКонтакте",
              })
            : ""
        }
      </div>
    </div>`;
  }

  function renderAboutStudioAside() {
    return `<aside id="about" class="faq-studio-aside min-w-0" aria-labelledby="about-title">
      <div class="about-intro-copy min-w-0 max-w-xl lg:max-w-none">
        <p class="eyebrow mb-4">О нас</p>
        <h2 id="about-title" class="display text-[clamp(24px,3.6vw,46px)] font-semibold text-ink">${esc(site.about.brandTitle)}</h2>
        <p class="mt-5 text-base leading-relaxed text-chrome md:mt-6 md:text-lg">${esc(site.about.text)}</p>
      </div>
      <ul id="about-stats" class="about-stats-grid m-0 grid w-full max-w-xl list-none grid-cols-2 gap-2.5 p-0 sm:gap-3 lg:max-w-none">${renderAboutStatCards()}</ul>
      <div class="faq-studio-map-wrap min-w-0">${renderAboutMapBlock()}</div>
    </aside>`;
  }

  function renderFaq() {
    const items = site.faq || [];
    if (!items.length) return "";
    const list = items
      .map(
        (item) => `<li class="faq-item">
          <details class="faq-details glass rounded-2xl">
            <summary class="faq-summary flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5">
              <span class="text-base font-semibold text-ink sm:text-lg">${esc(item.question)}</span>
              <span class="faq-chevron shrink-0 text-amber" aria-hidden="true">${icon("chevron-down", "size-5")}</span>
            </summary>
            <div class="faq-answer-reveal">
              <div class="faq-answer border-t border-white/10 px-5 pb-5 pt-4 text-left text-base leading-relaxed text-chrome sm:px-6 sm:pb-6 md:text-lg">
                <p class="m-0">${esc(item.answer)}</p>
              </div>
            </div>
          </details>
        </li>`
      )
      .join("");
    const sect = site.sections.faq || {};
    return `<section id="faq" aria-labelledby="faq-title" class="section isolate">
      ${backdrop("hex-ceiling", 0.85, "center top")}
      <div class="container-x">
        <div class="faq-about-pair text-left">
          <div class="faq-main min-w-0">
            <div class="faq-intro">
              ${heading({
                ...sect,
                id: "faq-title",
                className: "w-full max-w-none",
                leadClass: "mt-4 sm:mt-5",
              })}
            </div>
            <ul class="faq-list m-0 min-w-0 list-none p-0">${list}</ul>
          </div>
          ${renderAboutStudioAside()}
        </div>
      </div>
    </section>`;
  }


  function svcPrice(price) {
    return `<span class="svc-price ${price ? "" : "svc-price--none"}">${esc(price ?? "по запросу")}</span>`;
  }

  function svcCanBook(svc) {
    return !!(svc.priceItem && priceMap.has(svc.priceItem));
  }

  function renderServiceDesktop(svc, index) {
    const b = booking();
    const canBook = svcCanBook(svc);
    const selected = canBook && b.isSelected(svc.priceItem);
    const open = state.serviceOpenDesktop === svc.key;
    const highlighted = state.serviceHover === index || open;
    return `<li class="svc-item svc-item--row" data-key="${esc(svc.key)}" data-active="${highlighted}" data-open="${open}">
      <button type="button" class="svc-row" aria-expanded="${open}" data-toggle-service="${esc(svc.key)}">
        <span class="svc-row-body">
          <span class="svc-row-text">
            <span class="svc-title display">${esc(svc.title)}</span>
            <span class="svc-desc ${open ? "" : "svc-desc--clamp"}">${esc(svc.description)}</span>
          </span>
          <span class="svc-row-side">
            ${svcPrice(svc.price)}
            ${
              canBook
                ? `<span class="svc-pill" data-selected="${selected}" aria-hidden="true">${selected ? icon("check", "size-4") : icon("plus", "size-4")}${selected ? "В заявке" : "В заявку"}</span>`
                : ""
            }
            ${icon("chevron-down", "svc-chevron size-5")}
          </span>
        </span>
      </button>
      <div class="svc-acc-panel svc-row-panel" data-open="${open}">
        <div class="svc-acc-clip">
          <div class="svc-row-actions">
            ${
              canBook
                ? `<button type="button" class="svc-act svc-act--main" aria-pressed="${selected}" data-toggle-item="${esc(svc.priceItem)}">${selected ? icon("check", "size-4") : icon("plus", "size-4")}${selected ? "В заявке — убрать" : "Добавить в заявку"}</button>`
                : ""
            }
            <a href="#request" class="svc-act${canBook ? "" : " svc-act--main"}">Смотреть цены</a>
          </div>
        </div>
      </div>
    </li>`;
  }

  function renderServiceTouch(svc) {
    const b = booking();
    const canBook = svcCanBook(svc);
    const selected = canBook && b.isSelected(svc.priceItem);
    const open = state.serviceOpenTouch === svc.key;
    return `<li class="svc-item" data-key="${esc(svc.key)}">
      <button type="button" class="svc-acc-head" data-open="${open}" aria-expanded="${open}" data-toggle-service="${esc(svc.key)}">
        <span class="svc-title display">${esc(svc.title)}</span>
        <span class="svc-acc-side">${svcPrice(svc.price)}${icon("chevron-down", "svc-chevron size-5")}</span>
      </button>
      <div class="svc-acc-panel" data-open="${open}">
        <div class="svc-acc-clip">
          <div class="svc-acc-body">
            ${picture({ ...svc.image, decorative: true, className: "svc-acc-photo" })}
            <p class="svc-desc">${esc(svc.description)}</p>
            ${
              canBook
                ? btn({
                    variant: selected ? "glass" : "primary",
                    className: "svc-acc-btn",
                    attrs: `aria-pressed="${selected}" data-toggle-item="${esc(svc.priceItem)}"`,
                    children: `${selected ? icon("check", "size-4") : icon("plus", "size-4")}${selected ? "В заявке — убрать" : "Добавить в заявку"}`,
                  })
                : btn({
                    variant: "glass",
                    className: "svc-acc-btn",
                    href: "#request",
                    children: "Смотреть цены",
                  })
            }
          </div>
        </div>
      </div>
    </li>`;
  }

  function renderServices() {
    const split = isSplit();
    const b = booking();
    const hover = state.serviceHover;
    const openIdx = site.services.findIndex((s) => s.key === state.serviceOpenDesktop);
    const activeIdx = hover ?? (openIdx >= 0 ? openIdx : 0);
    const active = site.services[activeIdx] || site.services[0];
    const list = split
      ? site.services.map((s, i) => renderServiceDesktop(s, i)).join("")
      : site.services.map((s) => renderServiceTouch(s)).join("");
    const foot =
      b.items.length > 0
        ? `<p class="text-sm text-chrome">Услуги добавлены в заявку</p>${btn({ variant: "primary", arrow: true, attrs: 'data-go-form', children: "Перейти к заявке" })}`
        : `<p class="text-sm text-chrome">${esc(split ? site.sections.services.hintDesktop : site.sections.services.hintTouch)}</p>${btn({ variant: "glass", href: "#request", children: "Смотреть цены" })}`;
    const comparePair = site.beforeAfter[0];
    const frame =
      split && comparePair
        ? `<div class="svc-frame svc-frame--compare">
            ${renderBaCompare(comparePair, { cardClass: "ba-card svc-ba-card" })}
            <div class="svc-caption glass">
              <span class="svc-caption-title display">${esc(active.title)}</span>
              ${active.price ? `<span class="svc-caption-price">${esc(active.price)}</span>` : ""}
            </div>
          </div>`
        : "";
    return `<section id="services" aria-labelledby="services-title" class="section isolate">
      ${backdrop("box-corridor", 0.7)}
      <div class="container-x">
        ${heading({ ...site.sections.services, id: "services-title" })}
        <div class="svc-layout ${split ? "svc-layout--split" : ""}" id="svc-layout">
          <div class="svc-main">
            <ul class="svc-list" id="svc-list">${list}</ul>
            <div class="svc-foot" id="svc-foot">${foot}</div>
          </div>
          ${frame}
        </div>
      </div>
    </section>`;
  }

  function clampPos(v) {
    return Math.min(100, Math.max(0, v));
  }

  function renderBaCompare(pair, { cardClass = "ba-card" } = {}) {
    const touch = isTouch();
    const start = touch ? 50 : 0;
    return `<figure class="${cardClass}" data-ba="${esc(pair.key)}">
      <div class="ba-frame" data-touch="${touch}" style="aspect-ratio: ${pair.before.width} / ${pair.before.height}; --pos:${start}%">
        <img src="${esc(pair.before.src)}" alt="${esc(pair.before.alt)}" width="${pair.before.width}" height="${pair.before.height}" loading="lazy" decoding="async" draggable="false" class="ba-img">
        <img src="${esc(pair.after.src)}" alt="${esc(pair.after.alt)}" width="${pair.after.width}" height="${pair.after.height}" loading="lazy" decoding="async" draggable="false" class="ba-img ba-after">
        <span class="ba-tag ba-tag-after" aria-hidden="true">После</span>
        <span class="ba-tag ba-tag-before" aria-hidden="true">До</span>
        <div class="ba-line" aria-hidden="true"></div>
        ${touch ? `<span class="ba-hint" aria-hidden="true">${icon("chevrons-left-right", "size-3.5")} Тяните</span>` : ""}
        <div class="ba-handle" role="slider" tabindex="0" aria-label="Сравнение до и после: ${esc(pair.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${start}" aria-valuetext="После: ${start}%" data-ba-handle="${esc(pair.key)}">${icon("chevrons-left-right", "size-4")}</div>
      </div>
    </figure>`;
  }

  function stars(count, label, className = "size-4") {
    return `<span class="flex gap-0.5" role="img" aria-label="${esc(label)}">${Array.from({ length: count }, () => icon("star", `${className} fill-amber text-amber`, "fill-amber")).join("")}</span>`;
  }

  function reviewQuote(review) {
    return `«${review.text}»`;
  }

  function renderReviews() {
    if (!site.reviews.length) return "";
    const s = site.reviewSummary;
    const cards = site.reviews
      .map((r) => {
        const open = !!state.reviewOpen[r.key];
        return `<li class="review-card glass flex flex-col gap-3 rounded-2xl p-4 md:gap-4 md:p-6" data-review="${esc(r.key)}">
          <div class="flex items-center gap-3">
            <span aria-hidden="true" class="review-avatar display grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-ink md:size-12">${esc(r.initials)}</span>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-ink md:text-base">${esc(r.author)}</p>
              <p class="flex items-center gap-1.5 text-[13px] text-chrome">${icon("map-pin", "size-3.5")}${esc(r.source)}</p>
            </div>
          </div>
          ${stars(r.rating, `Оценка ${r.rating} из 5`)}
          <blockquote class="review-text text-sm leading-relaxed text-ink/90 md:text-[15px] ${open ? "" : "review-text-clamp"}">${esc(reviewQuote(r)).replace(/\n/g, "<br>")}</blockquote>
          <button type="button" class="review-toggle self-start text-[13px] font-medium text-amber md:hidden" aria-expanded="${open}" data-toggle-review="${esc(r.key)}">${open ? "Свернуть" : "Читать полностью"}</button>
        </li>`;
      })
      .join("");
    return `<section id="reviews" aria-labelledby="reviews-title" class="section isolate">
      ${backdrop("box-corridor", 0.7, "center 70%")}
      <div class="container-x">
        <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          ${heading({ ...site.sections.reviews, id: "reviews-title" })}
          <div class="glass flex flex-wrap items-center gap-x-4 gap-y-2 self-start rounded-3xl px-5 py-4 lg:max-w-md">
            <span class="display text-4xl font-semibold text-amber">${esc(s.rating)}</span>
            ${stars(Math.round(Number(s.rating)), `Оценка ${s.rating} из 5`, "size-5")}
            <span class="basis-full text-sm leading-snug text-chrome">${esc(s.text)}</span>
          </div>
        </div>
        <ul id="review-track" class="review-track mt-10 md:mt-14 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3">${cards}</ul>
        <div class="mt-4 flex justify-center gap-3 md:hidden">
          ${btn({ variant: "icon", attrs: 'aria-label="Предыдущие отзывы" data-reviews-dir="-1"', children: icon("chevron-left", "size-5") })}
          ${btn({ variant: "icon", attrs: 'aria-label="Следующие отзывы" data-reviews-dir="1"', children: icon("chevron-right", "size-5") })}
        </div>
      </div>
    </section>`;
  }

  function digitsFromPhone(value) {
    const trimmed = value.trim();
    if (trimmed.startsWith("+7")) return trimmed.slice(2).replace(/\D/g, "").slice(0, 10);
    let digits = trimmed.replace(/\D/g, "");
    if (digits.length === 11 && (digits.startsWith("8") || digits.startsWith("7"))) digits = digits.slice(1);
    return digits.slice(0, 10);
  }

  const PHONE_PREFIX = "+7 (";

  function formatPhone(value) {
    const trimmed = value.trim();
    if (["7", "8", "+"].includes(trimmed)) return PHONE_PREFIX;
    const d = digitsFromPhone(value);
    if (!d) return trimmed === PHONE_PREFIX.trim() ? PHONE_PREFIX : "";
    let out = PHONE_PREFIX + d.slice(0, 3);
    if (d.length > 3) out += ") " + d.slice(3, 6);
    if (d.length > 6) out += "-" + d.slice(6, 8);
    if (d.length > 8) out += "-" + d.slice(8, 10);
    return out;
  }

  function maskPhone(prev, next, caret) {
    if (prev === PHONE_PREFIX && next === PHONE_PREFIX + "7") return PHONE_PREFIX;
    if (next.length < prev.length && digitsFromPhone(next) === digitsFromPhone(prev) && next.startsWith("+7")) {
      const y = caret ?? next.length;
      const x = next.slice(2, y).replace(/\D/g, "").length;
      const E = digitsFromPhone(next);
      if (x > 0) return formatPhone(E.slice(0, x - 1) + E.slice(x)) || "";
    }
    return formatPhone(next);
  }

  function validateForm(form) {
    const errors = {};
    if (form.name.trim().length < 2) errors.name = "Укажите имя";
    if (!form.phone.trim()) errors.phone = "Укажите телефон";
    else if (digitsFromPhone(form.phone).length !== 10) errors.phone = "Номер неполный";
    if (!form.consent) errors.consent = "Нужно согласие на обработку персональных данных";
    return errors;
  }

  function renderPriceRow(item) {
    const selected = booking().isSelected(item.key);
    const price =
      item.price === undefined
        ? `<span class="req-price req-price-none">по запросу</span>`
        : `<span class="req-price">от<span class="req-amount">${formatPrice(item.price)}</span></span>`;
    return `<button type="button" aria-pressed="${selected}" data-toggle-item="${esc(item.key)}" class="req-row" ${selected ? "data-selected" : ""}>
      <span class="req-check" aria-hidden="true">${icon("check", "size-3.5")}</span>
      <span class="req-text">
        <span class="req-title">${esc(item.title)}</span>
        <span class="req-tag">${esc(item.group)}</span>
        ${item.note ? `<span class="req-note">${esc(item.note)}</span>` : ""}
      </span>
      ${price}
    </button>`;
  }

  function renderPills() {
    return `<div role="group" aria-label="Категории услуг" class="req-pills" id="req-pills">${[ALL, ...groups]
      .map((g) => `<button type="button" aria-pressed="${state.category === g}" data-category="${esc(g)}" class="req-pill">${esc(g)}</button>`)
      .join("")}</div>`;
  }

  function renderMini() {
    const b = booking();
    const preview = b.items.slice(0, 4);
    const list =
      b.items.length === 0
        ? `<p class="req-mini-empty">Отметьте услуги слева</p>`
        : `<ul class="req-mini-list">${preview.map((i) => `<li>${esc(i.title)}</li>`).join("")}${b.items.length > preview.length ? `<li aria-label="и другие">…</li>` : ""}</ul>`;
    const total =
      b.total > 0
        ? `<span class="req-mini-from">от</span><span class="req-mini-sum">${formatPrice(b.total)}</span>`
        : `<span class="req-mini-sum">—</span>`;
    return `<aside aria-label="Смета, кратко" class="req-mini glass lg:hidden" id="req-mini">
      <p class="req-mini-label"><span class="size-1.5 rounded-full bg-amber" aria-hidden="true"></span>Смета</p>
      ${list}
      <div class="req-mini-total" aria-live="polite">${total}</div>
      <button type="button" data-go-form class="req-mini-cta">К заявке${icon("arrow-right", "size-3.5")}</button>
    </aside>`;
  }

  function renderSelectedList() {
    const b = booking();
    if (!b.items.length) {
      return `<p class="mt-5 text-sm leading-relaxed text-chrome">Отметьте услуги <span class="lg:hidden">в списке</span><span class="hidden lg:inline">слева</span> — смета соберётся здесь.</p>`;
    }
    return `<ul class="req-sel mt-5 flex flex-col gap-3.5">${b.items
      .map(
        (item) => `<li class="flex items-start gap-3">
          <span class="min-w-0 flex-1">
            <span class="block text-sm text-ink">${esc(item.title)}</span>
            <span class="mt-0.5 block text-[11px] uppercase tracking-[0.12em] text-chrome">${esc(item.group)}</span>
          </span>
          <span class="text-sm tabular-nums text-ink">${item.price === undefined ? "по запросу" : formatPrice(item.price)}</span>
          <button type="button" data-remove-item="${esc(item.key)}" aria-label="Убрать: ${esc(item.title)}" class="req-x">${icon("x", "size-4")}</button>
        </li>`
      )
      .join("")}</ul>`;
  }

  function field(id, key, label, optional, attrs) {
    const errors = state.formTried ? validateForm(state.form) : {};
    const err = errors[key];
    return `<div>
      <label for="${id}" class="mb-2 block text-sm text-chrome">${esc(label)}${optional ? " (необязательно)" : ""}</label>
      <input id="${id}" class="field" value="${esc(state.form[key])}" ${err ? `aria-invalid="true" aria-describedby="${id}-error"` : ""} ${attrs}>
      ${err ? `<p id="${id}-error" class="mt-1.5 text-[13px] text-danger">${esc(err)}</p>` : ""}
    </div>`;
  }

  function renderForm() {
    if (state.formDone) {
      return `<div id="lead-form-wrap" role="status" class="p-1 pt-5">
        ${icon("circle-check", "size-10 text-amber")}
        <h3 class="display mt-4 text-xl font-semibold text-ink">Заявка принята</h3>
        <p class="mt-3 text-ink/90">Мы перезвоним, чтобы подтвердить время.</p>
        <p class="mt-2 text-[13px] leading-relaxed text-chrome">Данные пока никуда не отправляются: форма работает в демонстрационном режиме.</p>
        ${btn({ variant: "glass", className: "mt-6", attrs: "data-reset-form", children: "Отправить ещё одну" })}
      </div>`;
    }
    const consentErr = state.formTried && !state.form.consent;
    return `<form id="lead-form-wrap" novalidate class="flex flex-col gap-4 p-1 pt-5">
      ${field("lead-name", "name", "Ваше имя", false, 'type="text" autocomplete="name" data-field="name"')}
      ${field("lead-phone", "phone", "Телефон", false, 'type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" data-field="phone"')}
      ${field("lead-car", "car", "Марка и модель авто", true, 'type="text" placeholder="Например, Mazda 6" data-field="car"')}
      <div>
        <label class="consent">
          <input type="checkbox" id="lead-consent" name="consent" data-field="consent" ${state.form.consent ? "checked" : ""}>
          <span>Я даю <a href="./legal/consent.html" data-legal-popup>согласие на обработку персональных данных</a> и принимаю <a href="./legal/privacy.html" data-legal-popup>политику конфиденциальности</a>.</span>
        </label>
        ${consentErr ? `<p class="consent-error mt-1.5" id="lead-consent-error">Нужно согласие на обработку персональных данных</p>` : ""}
      </div>
      ${btn({
        variant: "primary",
        arrow: true,
        type: "submit",
        className: "w-full",
        attrs: state.formSending ? "disabled" : "",
        children: state.formSending ? "Отправляем…" : "Отправить заявку",
      })}
    </form>`;
  }

  function renderPanel() {
    const b = booking();
    return `<aside aria-label="Смета работ" class="req-panel glass p-6 lg:sticky lg:top-24" id="req-panel">
      <div class="flex items-center justify-between gap-3">
        <h3 class="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.28em] text-chrome">
          <span class="size-1.5 rounded-full bg-amber" aria-hidden="true"></span>Смета работ
        </h3>
        <span class="glass rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-chrome">${esc(site.brand.short)}</span>
      </div>
      <div id="req-selected">${renderSelectedList()}</div>
      <div class="mt-6 flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        ${icon("shield-check", "mt-0.5 size-5 shrink-0 text-amber")}
        <p class="text-[13px] leading-relaxed text-chrome">
          <span class="block font-semibold text-ink">${esc(site.sections.request.standard.title)}</span>
          ${esc(site.sections.request.standard.text)}
        </p>
      </div>
      <div class="mt-6 border-t border-white/10 pt-5">
        <p class="eyebrow !text-chrome">Расчётная стоимость</p>
        <p class="mt-3 flex items-baseline justify-end gap-2.5">
          ${b.total > 0 ? `<span class="text-sm text-chrome">от</span>` : ""}
          <span class="req-total">${b.total > 0 ? formatPrice(b.total) : "—"}</span>
        </p>
        <p class="mt-3 text-[11px] leading-relaxed text-chrome">* ${esc(site.sections.request.totalNote)}${b.hasOnRequest ? "; позиции «по запросу» мастер оценит на осмотре" : ""}</p>
      </div>
      <button type="button" data-go-form class="req-cta mt-6">Оформить заявку${icon("arrow-right", "size-4")}</button>
      <div id="lead-form-slot">${renderForm()}</div>
    </aside>`;
  }

  function renderRequestList() {
    const items = state.category === ALL ? site.priceList : site.priceList.filter((i) => i.group === state.category);
    return items.map(renderPriceRow).join("");
  }

  function renderRequest() {
    return `<section id="request" aria-labelledby="request-title" class="section relative isolate">
      ${backdrop("studio-car", 0.5)}
      <div class="container-x">
        ${heading({ ...site.sections.request, id: "request-title" })}
        <div class="mt-10">${renderPills()}</div>
        <div class="req-layout mt-5">
          <div class="req-split">
            <div class="req-list min-w-0" id="req-list">${renderRequestList()}</div>
            ${renderMini()}
          </div>
          ${renderPanel()}
        </div>
      </div>
    </section>`;
  }

  function renderFooter() {
    const nav = site.nav
      .map((item) => `<li><a href="${esc(item.href)}">${esc(item.label)}</a></li>`)
      .join("");
    return `<footer class="site-footer">
      <div class="container-x">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="#hero" class="brand-lockup" aria-label="${esc(site.brand.name)} — на главную">
              ${brandMark()}
              <span class="brand-name">${esc(site.brand.name)}</span>
            </a>
            <p class="footer-lead">Детейлинг в Нижнем Новгороде: тонировка, бронирование плёнкой, химчистка салона.</p>
          </div>
          <div>
            <p class="footer-heading">Разделы</p>
            <ul class="footer-links">${nav}</ul>
          </div>
        </div>
      </div>
    </footer>`;
  }

  function renderLegalBar() {
    if (window.ML_LEGAL && typeof window.ML_LEGAL.barHtml === "function") {
      return window.ML_LEGAL.barHtml({ prefix: "./legal/" });
    }
    return "";
  }

  function renderCookieBanner() {
    if (window.ML_LEGAL && typeof window.ML_LEGAL.cookieHtml === "function") {
      return window.ML_LEGAL.cookieHtml("./legal/cookies.html");
    }
    return `<div id="cookie-banner" class="cookie-banner" hidden role="dialog" aria-label="Уведомление об использовании cookie">
      <p>Мы используем cookie, чтобы сайт работал стабильно и было удобнее пользоваться формой заявки. Подробности — в <a href="./legal/cookies.html">политике cookie</a>.</p>
      <button type="button" class="btn btn-primary" data-cookie-accept><span class="relative inline-flex items-center gap-2">Понятно</span></button>
    </div>`;
  }

  function renderPage() {
    const app = document.getElementById("app");
    app.innerHTML = `${renderHeader()}
      <main class="min-h-screen bg-obsidian text-ink">
        ${renderHero()}
        ${
          site.worksRow1.length
            ? `<section id="works" aria-labelledby="works-title" class="section overflow-hidden pt-[clamp(56px,7vw,96px)]">
                <div class="container-x">${heading({ ...site.sections.works, id: "works-title" })}</div>
                <div class="mt-10 flex flex-col gap-4 md:mt-12 md:gap-6">
                  ${worksRow(site.worksRow1, "forward", "Работы, первый ряд")}
                  ${worksRow(site.worksRow2, "backward", "Работы, второй ряд")}
                </div>
              </section>`
            : ""
        }
        ${textStrip(site.strips.services, "amber")}
        ${site.services.length ? renderServices() : ""}
        ${textStrip(site.strips.brand)}
        ${renderReviews()}
        ${renderRequest()}
        ${renderFaq()}
      </main>
      ${renderFooter()}
      ${renderLegalBar()}
      ${renderCookieBanner()}`;
  }

  function refreshServicesChrome() {
    const root = document.getElementById("services");
    if (!root) return;
    const next = document.createElement("div");
    next.innerHTML = renderServices();
    root.replaceWith(next.firstElementChild);
    bindServices();
    bindBeforeAfter();
  }

  function refreshBooking() {
    const list = document.getElementById("req-list");
    if (list) list.innerHTML = renderRequestList();
    const mini = document.getElementById("req-mini");
    if (mini) {
      const wrap = document.createElement("div");
      wrap.innerHTML = renderMini();
      mini.replaceWith(wrap.firstElementChild);
    }
    const selected = document.getElementById("req-selected");
    if (selected) selected.innerHTML = renderSelectedList();
    const panel = document.getElementById("req-panel");
    if (panel) {
      const totalEl = panel.querySelector(".req-total");
      const b = booking();
      if (totalEl) totalEl.textContent = b.total > 0 ? formatPrice(b.total) : "—";
      const from = panel.querySelector(".mt-3.flex.items-baseline");
      if (from) {
        from.innerHTML = `${b.total > 0 ? `<span class="text-sm text-chrome">от</span>` : ""}<span class="req-total">${b.total > 0 ? formatPrice(b.total) : "—"}</span>`;
      }
      const note = panel.querySelector(".mt-3.text-\\[11px\\], p.mt-3.text-\\[11px\\]");
      const noteEl = panel.querySelectorAll("p")[panel.querySelectorAll("p").length - 1];
      // safer: find the asterisk note
      panel.querySelectorAll("p").forEach((p) => {
        if (p.textContent.trim().startsWith("*")) {
          p.textContent = `* ${site.sections.request.totalNote}${b.hasOnRequest ? "; позиции «по запросу» мастер оценит на осмотре" : ""}`;
        }
      });
    }
    document.querySelectorAll(".req-row").forEach((row) => {
      const key = row.getAttribute("data-toggle-item");
      row.setAttribute("aria-pressed", String(booking().isSelected(key)));
    });
  }

  function sectionScrollOffset(el) {
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop);
    if (Number.isFinite(margin) && margin > 0) return margin;
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
    return Number.isFinite(pad) ? pad : 0;
  }

  function headerScrollInset() {
    const root = document.documentElement;
    const header = parseFloat(getComputedStyle(root).getPropertyValue("--header-offset"));
    if (Number.isFinite(header) && header > 0) return header;
    const bar = document.getElementById("site-header");
    return bar ? Math.ceil(bar.getBoundingClientRect().height) : 0;
  }

  function sectionTitleScrollGap() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const gap =
      parseFloat(style.getPropertyValue("--section-title-scroll-gap")) ||
      parseFloat(style.getPropertyValue("--works-title-scroll-gap"));
    return Number.isFinite(gap) ? gap : 16;
  }

  function sectionTitleAnchor(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return null;
    const labelled = section.getAttribute("aria-labelledby");
    if (labelled) {
      const titleEl = document.getElementById(labelled);
      if (titleEl) {
        return (
          titleEl.closest("header") ||
          titleEl.closest(".faq-intro") ||
          titleEl.closest(".about-intro-copy") ||
          titleEl.parentElement
        );
      }
    }
    return (
      section.querySelector("header") ||
      section.querySelector(".faq-intro") ||
      section.querySelector(".about-intro-copy") ||
      section.querySelector(".container-x > header")
    );
  }

  function scrollToSectionById(id, { updateHash = true, forceSmooth = false } = {}) {
    const el = document.getElementById(id);
    if (!el) return;
    let top;
    if (id === "hero") {
      top = 0;
    } else {
      const head = sectionTitleAnchor(id);
      if (head) {
        top = head.getBoundingClientRect().top + window.scrollY - headerScrollInset() - sectionTitleScrollGap();
      } else {
        top = el.getBoundingClientRect().top + window.scrollY - sectionScrollOffset(el);
      }
    }
    window.scrollTo({ top: Math.max(0, top), behavior: forceSmooth || !reducedMotion() ? "smooth" : "auto" });
    if (updateHash) history.pushState(null, "", `#${id}`);
  }

  function goToForm() {
    const el = document.getElementById("lead-name") || document.getElementById("lead-form-wrap");
    el?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "center" });
    window.setTimeout(() => document.getElementById("lead-name")?.focus({ preventScroll: true }), 600);
  }

  function bindHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;

    const menuBtn = document.getElementById("header-menu-btn");
    const mobileNav = document.getElementById("header-nav-mobile");

    const setHeaderOffset = () => {
      const topbar = document.getElementById("site-topbar");
      const topbarH = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 0;
      const h = Math.ceil(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--topbar-offset", `${topbarH}px`);
      document.documentElement.style.setProperty("--header-offset", `${h + topbarH}px`);
    };

    const setScrolled = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
      setHeaderOffset();
    };

    const closeMenu = () => {
      if (!menuBtn || !mobileNav) return;
      mobileNav.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Открыть меню");
      header.classList.remove("is-menu-open");
      setHeaderOffset();
    };

    const openMenu = () => {
      if (!menuBtn || !mobileNav) return;
      mobileNav.hidden = false;
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Закрыть меню");
      header.classList.add("is-menu-open");
      setHeaderOffset();
    };

    const toggleMenu = () => {
      if (!mobileNav) return;
      if (mobileNav.hidden) openMenu();
      else closeMenu();
    };

    setScrolled();
    setHeaderOffset();

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          setScrolled();
          ticking = false;
        });
      },
      { passive: true }
    );

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 1024px)").matches) closeMenu();
      setHeaderOffset();
    });

    menuBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleMenu();
    });

    mobileNav?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) closeMenu();
    });
  }

  function bindStats() {
    const list = document.getElementById("about-stats");
    if (!list) return;
    const run = () => {
      list.querySelectorAll("[data-stat]").forEach((el) => {
        const value = Number(el.dataset.value);
        const decimals = Number(el.dataset.decimals || 0);
        if (reducedMotion()) {
          el.textContent = formatStat(value, decimals);
          return;
        }
        const start = performance.now();
        const duration = 1800;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = formatStat(value * eased, decimals);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(list);
  }

  function bindServices() {
    const list = document.getElementById("svc-list");
    if (!list) return;
    list.querySelectorAll(".svc-item--row").forEach((li, index) => {
      li.addEventListener("mouseenter", () => {
        state.serviceHover = index;
        refreshServicesChrome();
      });
      li.addEventListener("mouseleave", () => {
        if (state.serviceHover === index) state.serviceHover = null;
        refreshServicesChrome();
      });
    });
  }

  function wrapWorksScroll(row, track) {
    const half = track.scrollWidth / 2;
    if (half <= 0) return;
    if (row.scrollLeft >= half) row.scrollLeft -= half;
    else if (row.scrollLeft < 0) row.scrollLeft += half;
  }

  function bindWorks() {
    const rows = document.querySelectorAll(".works-marquee");
    if (!rows.length) return;

    const worksSection = document.getElementById("works");
    let sectionVisible = true;
    if (worksSection) {
      const io = new IntersectionObserver(([entry]) => {
        sectionVisible = entry.isIntersecting;
      }, { threshold: 0 });
      io.observe(worksSection);
    }

    const WORKS_CYCLE_MS = 18000;

    rows.forEach((row) => {
      const track = row.querySelector(".works-marquee-track");
      if (!track) return;

      const dir = row.getAttribute("data-works-dir") === "backward" ? -1 : 1;
      if (dir < 0 && track.scrollWidth > 0) row.scrollLeft = track.scrollWidth / 2;

      let paused = false;
      let grabbing = false;
      let drag = null;
      let scrollPos = row.scrollLeft;
      let lastTs = 0;
      let raf = 0;

      const setPaused = (value) => {
        paused = value;
      };

      const syncScrollPos = () => {
        scrollPos = row.scrollLeft;
      };

      const tick = (ts) => {
        const half = track.scrollWidth / 2;
        const active = half > 0 && sectionVisible && !paused && !grabbing && !reducedMotion();
        if (!active) {
          lastTs = 0;
          syncScrollPos();
          raf = requestAnimationFrame(tick);
          return;
        }
        if (!lastTs) lastTs = ts;
        const dt = Math.min(ts - lastTs, 50);
        lastTs = ts;
        scrollPos += dir * (half / WORKS_CYCLE_MS) * dt;
        if (scrollPos >= half) scrollPos -= half;
        else if (scrollPos < 0) scrollPos += half;
        row.scrollLeft = scrollPos;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      row.addEventListener("mouseenter", () => setPaused(true));
      row.addEventListener("mouseleave", () => {
        if (!grabbing) setPaused(false);
      });

      row.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        const step = 320;
        row.scrollLeft += event.key === "ArrowLeft" ? -step : step;
        wrapWorksScroll(row, track);
        syncScrollPos();
        event.preventDefault();
      });

      row.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        grabbing = true;
        drag = { id: event.pointerId, x: event.clientX, scroll: row.scrollLeft };
        row.classList.add("is-grabbing");
        row.setPointerCapture(event.pointerId);
        setPaused(true);
      });

      const endDrag = (event) => {
        if (!drag || drag.id !== event.pointerId) return;
        row.classList.remove("is-grabbing");
        row.releasePointerCapture(event.pointerId);
        drag = null;
        grabbing = false;
        if (!row.matches(":hover")) setPaused(false);
      };

      row.addEventListener("pointermove", (event) => {
        if (!drag || drag.id !== event.pointerId) return;
        row.scrollLeft = drag.scroll - (event.clientX - drag.x);
        wrapWorksScroll(row, track);
        syncScrollPos();
      });

      const endDragAndSync = (event) => {
        endDrag(event);
        syncScrollPos();
      };

      row.addEventListener("pointerup", endDragAndSync);
      row.addEventListener("pointercancel", endDragAndSync);
    });
  }

  function bindBeforeAfter() {
    document.querySelectorAll("[data-ba]").forEach((card) => {
      const frame = card.querySelector(".ba-frame");
      const handle = card.querySelector("[data-ba-handle]");
      const hint = card.querySelector(".ba-hint");
      const touch = isTouch();
      let target = touch ? 50 : 0;
      let current = target;
      let raf = 0;
      let pointer = null;

      const setPos = (value, snap = false) => {
        target = clampPos(value);
        if (snap || reducedMotion()) {
          current = target;
          frame.style.setProperty("--pos", `${current}%`);
        } else {
          const step = () => {
            const delta = target - current;
            current = Math.abs(delta) < 0.1 ? target : current + delta * 0.18;
            frame.style.setProperty("--pos", `${current}%`);
            if (current !== target) raf = requestAnimationFrame(step);
          };
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(step);
        }
      };

      const posFromEvent = (event) => {
        const rect = frame.getBoundingClientRect();
        if (!rect.width) return target;
        return ((event.clientX - rect.left) / rect.width) * 100;
      };

      frame.addEventListener("pointermove", (event) => {
        if (event.pointerType === "mouse" && !touch) {
          setPos(posFromEvent(event));
          return;
        }
        if (!pointer || pointer.id !== event.pointerId) return;
        if (!pointer.active) {
          const dx = Math.abs(event.clientX - pointer.x);
          const dy = Math.abs(event.clientY - pointer.y);
          if (dy > 8 && dy > dx) {
            pointer = null;
            return;
          }
          if (dx < 6) return;
          pointer.active = true;
          frame.setPointerCapture(event.pointerId);
        }
        setPos(posFromEvent(event), true);
      });
      frame.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse" || touch) {
          pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false };
        }
        if (hint) hint.remove();
      });
      const end = (event) => {
        const p = pointer;
        pointer = null;
        if (p && !p.active && event.type === "pointerup") setPos(posFromEvent(event));
        handle.setAttribute("aria-valuenow", String(Math.round(target)));
        handle.setAttribute("aria-valuetext", `После: ${Math.round(target)}%`);
      };
      frame.addEventListener("pointerup", end);
      frame.addEventListener("pointercancel", end);
      frame.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "mouse" && !touch) setPos(touch ? 50 : 0);
      });
      handle.addEventListener("keydown", (event) => {
        const map = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 };
        let next;
        if (event.key in map) next = target + map[event.key];
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = 100;
        if (next !== undefined) {
          event.preventDefault();
          if (hint) hint.remove();
          setPos(next);
          handle.setAttribute("aria-valuenow", String(Math.round(clampPos(next))));
          handle.setAttribute("aria-valuetext", `После: ${Math.round(clampPos(next))}%`);
        }
      });
    });
  }

  function bindFormSlot() {
    const form = document.querySelector("#lead-form-slot form");
    if (!form) return;
    form.addEventListener("input", (event) => {
      const fieldName = event.target.getAttribute("data-field");
      if (!fieldName) return;
      if (fieldName === "consent") {
        state.form.consent = event.target.checked;
        return;
      }
      let value = event.target.value;
      if (fieldName === "phone") value = maskPhone(state.form.phone, value, event.target.selectionStart);
      state.form[fieldName] = value;
      if (fieldName === "phone" && event.target.value !== value) {
        event.target.value = value;
      }
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      state.formTried = true;
      const errors = validateForm(state.form);
      if (Object.keys(errors).length) {
        const first = ["name", "phone", "car", "consent"].find((k) => errors[k]);
        const map = { name: "lead-name", phone: "lead-phone", car: "lead-car", consent: "lead-consent" };
        refreshForm();
        document.getElementById(map[first])?.focus();
        return;
      }
      state.formSending = true;
      refreshForm();
      const b = booking();
      try {
        await site.submitLead({
          name: state.form.name,
          phone: state.form.phone,
          car: state.form.car,
          items: b.items.map((item) => ({ key: item.key, title: item.title, group: item.group, price: item.price ?? null })),
          total: b.total,
          hasOnRequest: b.hasOnRequest,
        });
        state.formSending = false;
        state.formDone = true;
        refreshForm();
      } catch (err) {
        state.formSending = false;
        refreshForm();
        alert("Не получилось отправить заявку. Попробуйте ещё раз.");
        console.error(err);
      }
    });
  }

  function refreshForm() {
    const slot = document.getElementById("lead-form-slot");
    if (!slot) return;
    slot.innerHTML = renderForm();
    bindFormSlot();
  }

  function bindGlobal() {
    document.addEventListener("click", (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (anchor) {
        const raw = anchor.getAttribute("href");
        if (raw && raw.length > 1) {
          const url = new URL(anchor.href, window.location.href);
          const normPath = (path) => path.replace(/\/index\.html$/i, "/").replace(/\/$/, "") || "/";
          if (url.origin === window.location.origin && normPath(url.pathname) === normPath(window.location.pathname)) {
            const id = decodeURIComponent(raw.slice(1));
            if (document.getElementById(id)) {
              event.preventDefault();
              scrollToSectionById(id, { forceSmooth: anchor.hasAttribute("data-smooth-scroll") });
              const mobileNav = document.getElementById("header-nav-mobile");
              const menuBtn = document.getElementById("header-menu-btn");
              if (mobileNav && !mobileNav.hidden) {
                mobileNav.hidden = true;
                menuBtn?.setAttribute("aria-expanded", "false");
                menuBtn?.setAttribute("aria-label", "Открыть меню");
                document.getElementById("site-header")?.classList.remove("is-menu-open");
              }
              return;
            }
          }
        }
      }
      const toggleService = event.target.closest("[data-toggle-service]");
      if (toggleService) {
        const key = toggleService.getAttribute("data-toggle-service");
        if (isSplit()) state.serviceOpenDesktop = state.serviceOpenDesktop === key ? null : key;
        else state.serviceOpenTouch = state.serviceOpenTouch === key ? null : key;
        refreshServicesChrome();
        return;
      }
      const toggleItemBtn = event.target.closest("[data-toggle-item]");
      if (toggleItemBtn) {
        toggleItem(toggleItemBtn.getAttribute("data-toggle-item"));
        return;
      }
      const removeBtn = event.target.closest("[data-remove-item]");
      if (removeBtn) {
        removeItem(removeBtn.getAttribute("data-remove-item"));
        return;
      }
      if (event.target.closest("[data-go-form]")) {
        goToForm();
        return;
      }
      const cat = event.target.closest("[data-category]");
      if (cat) {
        state.category = cat.getAttribute("data-category");
        document.getElementById("req-pills")?.replaceWith(Object.assign(document.createElement("div"), { innerHTML: renderPills() }).firstElementChild);
        // the replace above loses wrapper — do it properly
        const pillsHost = document.querySelector("#request .mt-10");
        if (pillsHost) pillsHost.innerHTML = renderPills();
        const list = document.getElementById("req-list");
        if (list) list.innerHTML = renderRequestList();
        return;
      }
      const reviewBtn = event.target.closest("[data-toggle-review]");
      if (reviewBtn) {
        const key = reviewBtn.getAttribute("data-toggle-review");
        state.reviewOpen[key] = !state.reviewOpen[key];
        const card = reviewBtn.closest("[data-review]");
        const quote = card?.querySelector("blockquote");
        quote?.classList.toggle("review-text-clamp", !state.reviewOpen[key]);
        reviewBtn.setAttribute("aria-expanded", String(!!state.reviewOpen[key]));
        reviewBtn.textContent = state.reviewOpen[key] ? "Свернуть" : "Читать полностью";
        return;
      }
      const dirBtn = event.target.closest("[data-reviews-dir]");
      if (dirBtn) {
        const track = document.getElementById("review-track");
        if (track) {
          const dir = Number(dirBtn.getAttribute("data-reviews-dir"));
          const width = (track.firstElementChild?.getBoundingClientRect().width ?? track.clientWidth * 0.78) + 12;
          track.scrollBy({ left: dir * width, behavior: reducedMotion() ? "auto" : "smooth" });
        }
        return;
      }
      if (event.target.closest("[data-unlock-map]")) {
        state.mapUnlocked = true;
        event.target.closest("[data-unlock-map]").remove();
        return;
      }
      if (event.target.closest("[data-reset-form]")) {
        state.form = { name: "", phone: "", car: "", consent: false };
        state.formTried = false;
        state.formSending = false;
        state.formDone = false;
        clearItems();
        refreshForm();
        return;
      }
    });

    let splitNow = isSplit();
    window.addEventListener("resize", () => {
      const next = isSplit();
      if (next !== splitNow) {
        splitNow = next;
        refreshServicesChrome();
      }
    });
  }

  applyTheme();
  renderPage();
  if (window.ML_LEGAL && typeof window.ML_LEGAL.syncSchema === "function") {
    window.ML_LEGAL.syncSchema();
  }
  if (location.hash.length > 1) {
    const id = decodeURIComponent(location.hash.slice(1));
    if (document.getElementById(id)) {
      requestAnimationFrame(() => scrollToSectionById(id, { updateHash: false }));
    }
  }
  bindHeader();
  bindStats();
  bindServices();
  bindWorks();
  bindBeforeAfter();
  bindFormSlot();
  bindGlobal();
  bindCookieBanner();

  function bindCookieBanner() {
    if (window.ML_LEGAL && typeof window.ML_LEGAL.bindCookie === "function") {
      window.ML_LEGAL.bindCookie();
      return;
    }
    const banner = document.getElementById("cookie-banner");
    if (!banner) return;
    try {
      if (localStorage.getItem("ml-cookie-consent") === "1") return;
    } catch (_) {}
    banner.hidden = false;
    banner.querySelector("[data-cookie-accept]")?.addEventListener("click", () => {
      try { localStorage.setItem("ml-cookie-consent", "1"); } catch (_) {}
      banner.hidden = true;
    });
  }
})();
