/**
 * Юридическая полоса, попапы документов, реквизиты и cookie-баннер.
 */
(function () {
  const site = window.ML_SITE || {};
  const legal = site.legal || {};
  const FIELDS = {
    legalName: legal.legalName || "[ИП ФИО]",
    inn: legal.inn || "[ИНН]",
    ogrn: legal.ogrn || "[ОГРН/ОГРНИП]",
    email: legal.email || "[email]",
    phone: legal.phone || "[телефон]",
  };
  const DOCS = [
    ["privacy.html", "Политика обработки персональных данных", "Политика ПДн"],
    ["consent.html", "Согласие на обработку ПДн", "Согласие"],
    ["terms.html", "Пользовательское соглашение", "Соглашение"],
    ["cookies.html", "Политика cookie", "Cookie"],
    ["offer.html", "Публичная оферта", "Оферта"],
  ];
  const DOC_SET = new Set(DOCS.map((d) => d[0]));
  let popupBound = false;
  let modalChromeBound = false;
  let activePopupFile = "";
  let lastFocus = null;

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isPlaceholder(value) {
    return String(value).indexOf("[") !== -1;
  }

  function fieldHtml(key) {
    const value = FIELDS[key];
    const placeholder = isPlaceholder(value);
    if (!placeholder && key === "email") {
      return `<a data-legal="email" href="mailto:${esc(value)}">${esc(value)}</a>`;
    }
    if (!placeholder && key === "phone") {
      const tel = String(value).replace(/[^\d+]/g, "");
      return `<a data-legal="phone" href="tel:${esc(tel)}">${esc(value)}</a>`;
    }
    const cls = placeholder ? "placeholder" : "";
    return `<span class="${cls}" data-legal="${key}">${esc(value)}</span>`;
  }

  function applyField(el) {
    const key = el.getAttribute("data-legal");
    if (!Object.prototype.hasOwnProperty.call(FIELDS, key)) return;
    const value = FIELDS[key];
    const placeholder = isPlaceholder(value);
    if (!placeholder && (key === "email" || key === "phone") && el.tagName !== "A") {
      const link = document.createElement("a");
      link.setAttribute("data-legal", key);
      link.textContent = value;
      link.href = key === "email" ? "mailto:" + value : "tel:" + String(value).replace(/[^\d+]/g, "");
      el.replaceWith(link);
      return;
    }
    el.textContent = value;
    el.classList.toggle("placeholder", placeholder);
    if (el.tagName === "A") {
      if (placeholder) el.removeAttribute("href");
      else if (key === "email") el.href = "mailto:" + value;
      else if (key === "phone") el.href = "tel:" + String(value).replace(/[^\d+]/g, "");
    }
  }

  function fill(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-legal]").forEach(applyField);
  }

  function onLegalPath() {
    return /\/legal\//i.test(location.pathname) || /\/legal$/i.test(location.pathname);
  }

  function docPrefix() {
    return onLegalPath() ? "./" : "./legal/";
  }

  function docUrl(file) {
    return docPrefix() + file;
  }

  function currentFile() {
    const parts = (location.pathname || "").split("/");
    return parts[parts.length - 1] || "";
  }

  function legalDocFileFromHref(href) {
    if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) {
      return null;
    }
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return null;
      const file = url.pathname.split("/").pop() || "";
      return DOC_SET.has(file) ? file : null;
    } catch (_) {
      return null;
    }
  }

  function docsHtml(prefix) {
    const here = currentFile();
    return DOCS.map(function (item) {
      const file = item[0];
      const label = item[1];
      const short = item[2] || label;
      const current = here === file ? ' aria-current="page"' : "";
      const title = short === label ? "" : ` title="${esc(label)}"`;
      return `<li><a href="${prefix}${file}" data-legal-popup${current}${title}>${esc(short)}</a></li>`;
    }).join("");
  }

  function modalSwitchHtml(activeFile) {
    return DOCS.map(function (item) {
      const file = item[0];
      const short = item[2] || item[1];
      const current = file === activeFile ? ' aria-current="true"' : "";
      return `<button type="button" data-legal-popup-doc="${esc(file)}"${current}>${esc(short)}</button>`;
    }).join("");
  }

  function reqItem(label, html) {
    return `<li><span class="legal-k">${esc(label)}</span><span class="legal-v">${html}</span></li>`;
  }

  function barHtml(opts) {
    const prefix = (opts && opts.prefix) || "./legal/";
    const year = new Date().getFullYear();
    const studio = (site.contacts && site.contacts.studioName) || "ML";
    const city = (site.brand && site.brand.city) || "Нижний Новгород";
    const address = (site.contacts && site.contacts.address) || "";
    return `<section class="legal-bar" id="legal-bar" aria-label="Юридическая информация">
      <div class="container-x legal-bar-inner">
        <p class="legal-bar-copy">© ${year} ${esc(studio)} · ${esc(city)}</p>
        <div class="legal-bar-details">
          <p class="legal-bar-kicker">Реквизиты</p>
          <ul class="legal-req">
            ${reqItem("Исполнитель", fieldHtml("legalName"))}
            ${reqItem("ИНН", fieldHtml("inn"))}
            ${reqItem("ОГРН/ОГРНИП", fieldHtml("ogrn"))}
            ${reqItem("E-mail", fieldHtml("email"))}
            ${reqItem("Телефон", fieldHtml("phone"))}
            ${address ? reqItem("Адрес", esc(address)) : ""}
          </ul>
        </div>
        <nav class="legal-bar-nav" aria-label="Документы">
          <ul class="legal-docs">${docsHtml(prefix)}</ul>
        </nav>
        <p class="legal-bar-offer"><a href="${prefix}offer.html" data-legal-popup>Цены не являются публичной офертой</a></p>
      </div>
    </section>`;
  }

  function cookieHtml(cookiesHref) {
    return `<div id="cookie-banner" class="cookie-banner" hidden role="dialog" aria-labelledby="cookie-banner-title">
      <div class="cookie-banner-copy">
        <p id="cookie-banner-title" class="cookie-banner-kicker">Cookie</p>
        <p>Мы используем cookie, чтобы сайт работал стабильно и было удобнее пользоваться формой заявки. Подробности — в <a href="${esc(cookiesHref)}" data-legal-popup>политике cookie</a>.</p>
      </div>
      <button type="button" class="btn btn-primary cookie-banner-btn" data-cookie-accept><span class="relative inline-flex items-center gap-2">Понятно</span></button>
    </div>`;
  }

  function modalShellHtml() {
    return `<div id="legal-modal" class="legal-modal" hidden>
      <button type="button" class="legal-modal-backdrop" data-legal-modal-close tabindex="-1" aria-hidden="true"></button>
      <div class="legal-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
        <div class="legal-modal-head">
          <p id="legal-modal-title" class="legal-modal-title">Документ</p>
          <button type="button" class="legal-modal-close" data-legal-modal-close aria-label="Закрыть">×</button>
        </div>
        <div class="legal-modal-switch" data-legal-modal-switch></div>
        <div class="legal-modal-body legal-doc" data-legal-modal-body>
          <p class="legal-modal-status">Загрузка…</p>
        </div>
      </div>
    </div>`;
  }

  function ensureModal() {
    if (document.getElementById("legal-modal")) return;
    if (!document.body) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = modalShellHtml();
    document.body.appendChild(wrap.firstElementChild);
    bindModalChrome();
  }

  function getModal() {
    return document.getElementById("legal-modal");
  }

  function setModalStatus(text, isError) {
    const body = document.querySelector("[data-legal-modal-body]");
    if (!body) return;
    body.innerHTML = `<p class="legal-modal-status${isError ? " legal-modal-status--error" : ""}">${esc(text)}</p>`;
  }

  function closeLegalPopup() {
    const modal = getModal();
    if (!modal || modal.hidden) return;
    const returnToLegalList = document.body.classList.contains("legal-page") && DOC_SET.has(currentFile());
    modal.hidden = true;
    document.documentElement.classList.remove("legal-modal-open");
    activePopupFile = "";
    if (lastFocus && typeof lastFocus.focus === "function") {
      try { lastFocus.focus(); } catch (_) {}
    }
    lastFocus = null;
    if (returnToLegalList) {
      const home = document.querySelector('.legal-header a[href*="index"]');
      if (home && home.getAttribute("href")) {
        location.href = home.getAttribute("href");
      }
    }
  }

  async function openLegalPopup(file) {
    if (!file || !DOC_SET.has(file)) return;
    ensureModal();
    const modal = getModal();
    if (!modal) return;

    lastFocus = document.activeElement;
    activePopupFile = file;
    modal.hidden = false;
    document.documentElement.classList.add("legal-modal-open");

    const titleEl = document.getElementById("legal-modal-title");
    const switchEl = document.querySelector("[data-legal-modal-switch]");
    const bodyEl = document.querySelector("[data-legal-modal-body]");
    const docMeta = DOCS.find((d) => d[0] === file);
    if (titleEl && docMeta) titleEl.textContent = docMeta[1];
    if (switchEl) switchEl.innerHTML = modalSwitchHtml(file);
    if (bodyEl) setModalStatus("Загрузка…");

    const closeBtn = modal.querySelector(".legal-modal-close");
    if (closeBtn) closeBtn.focus();

    try {
      const res = await fetch(docUrl(file), { credentials: "same-origin" });
      if (!res.ok) throw new Error("http-" + res.status);
      const html = await res.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const article = parsed.querySelector("article.legal-doc");
      if (!article) throw new Error("no-article");

      const h1 = article.querySelector("h1");
      if (titleEl && h1 && h1.textContent.trim()) titleEl.textContent = h1.textContent.trim();

      const clone = article.cloneNode(true);
      clone.querySelector(".legal-kicker")?.remove();
      clone.querySelector(".legal-switch")?.remove();
      clone.querySelector("h1")?.remove();

      if (bodyEl) {
        bodyEl.innerHTML = clone.innerHTML;
        bodyEl.classList.add("legal-doc");
        fill(bodyEl);
      }
    } catch (err) {
      setModalStatus("Не удалось загрузить документ. Попробуйте ещё раз или откройте страницу позже.", true);
    }
  }

  function bindModalChrome() {
    if (modalChromeBound) return;
    modalChromeBound = true;

    document.addEventListener("click", function (event) {
      const switchBtn = event.target.closest("[data-legal-popup-doc]");
      if (switchBtn) {
        event.preventDefault();
        openLegalPopup(switchBtn.getAttribute("data-legal-popup-doc"));
        return;
      }
      if (event.target.closest("[data-legal-modal-close]")) {
        event.preventDefault();
        closeLegalPopup();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeLegalPopup();
    });
  }

  function bindLegalPopups() {
    if (popupBound) return;
    popupBound = true;

    document.addEventListener(
      "click",
      function (event) {
        const anchor = event.target.closest("a[href]");
        if (!anchor) return;
        if (anchor.dataset.legalNoPopup === "true") return;
        const file = legalDocFileFromHref(anchor.getAttribute("href"));
        if (!file) return;
        event.preventDefault();
        event.stopPropagation();
        openLegalPopup(file);
      },
      true
    );
  }

  function bindCookie(banner) {
    const node = banner || document.getElementById("cookie-banner");
    if (!node) return;
    try {
      if (localStorage.getItem("ml-cookie-consent") === "1") return;
    } catch (_) {}
    node.hidden = false;
    document.documentElement.classList.add("has-cookie-banner");
    const button = node.querySelector("[data-cookie-accept]");
    if (!button || button.dataset.bound === "1") return;
    button.dataset.bound = "1";
    button.addEventListener("click", function () {
      try { localStorage.setItem("ml-cookie-consent", "1"); } catch (_) {}
      node.hidden = true;
      document.documentElement.classList.remove("has-cookie-banner");
    });
  }

  function syncSchema() {
    const node = document.querySelector('script[type="application/ld+json"]');
    if (!node) return;
    let data;
    try {
      data = JSON.parse(node.textContent);
    } catch (_) {
      return;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) return;
    if ("legalName" in data) data.legalName = FIELDS.legalName;
    if ("email" in data) data.email = FIELDS.email;
    node.textContent = JSON.stringify(data);
  }

  window.ML_LEGAL = {
    fields: FIELDS,
    barHtml: barHtml,
    cookieHtml: cookieHtml,
    fill: fill,
    bindCookie: bindCookie,
    syncSchema: syncSchema,
    openLegalPopup: openLegalPopup,
    closeLegalPopup: closeLegalPopup,
  };

  function bootLegalPage() {
    if (!document.body || !document.body.classList.contains("legal-page")) return;
    const mount = document.getElementById("legal-bar-mount");
    if (mount) mount.outerHTML = barHtml({ prefix: "./" });
    fill(document);
    const cookieMount = document.getElementById("cookie-banner-mount");
    if (cookieMount && !document.getElementById("cookie-banner")) {
      cookieMount.outerHTML = cookieHtml("./cookies.html");
    }
    bindCookie();

    const here = currentFile();
    if (DOC_SET.has(here) && document.querySelector(".legal-main")) {
      document.querySelector(".legal-main").hidden = true;
      openLegalPopup(here);
    }
  }

  function bootAll() {
    ensureModal();
    bindLegalPopups();
    bootLegalPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAll);
  } else {
    bootAll();
  }
})();