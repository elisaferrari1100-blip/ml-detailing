/* Блок «верхняя шапка». Разметка и поведение только шапки. */
(function () {
  var NAV_DESKTOP = window.matchMedia("(min-width: 1080px)");
  var TOPBAR_SELECTORS = [
    "#site-topbar",
    "#top-bar",
    "#topbar",
    "[data-block='topbar']",
    "[data-site-block='topbar']",
    ".site-topbar",
    ".top-bar",
    ".topbar",
  ];

  function site() {
    return window.ML_SITE || null;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function telHref(phone) {
    var compact = String(phone || "").replace(/[^\d+]/g, "");
    return compact ? "tel:" + compact : "";
  }

  function icon(name) {
    var paths = {
      phone:
        '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
      menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
      close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    };
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (paths[name] || "") +
      "</svg>"
    );
  }

  var LOGO_M_PATH =
    "M76.811 44.875V80.125H67.534V48.362l2.096.207L55.962 80.125H46.12L32.453 48.673l2.096-.235V80.125H25.271V44.875H40.32l12.634 30.259h-3.75l12.559-30.259Z";
  var LOGO_L_PATH =
    "M83.12 44.875V75.801l-4.38-4.343h26.358V80.125H73.363V44.875Z";

  function logoHtml() {
    return (
      '<span class="header-logo-letters" aria-hidden="true">' +
      '<svg class="header-logo-letter header-logo-letter--m" xmlns="http://www.w3.org/2000/svg" viewBox="24 43 54 40" focusable="false">' +
      '<path fill="currentColor" d="' +
      LOGO_M_PATH +
      '"/></svg>' +
      '<svg class="header-logo-letter header-logo-letter--l" xmlns="http://www.w3.org/2000/svg" viewBox="72 43 36 40" focusable="false">' +
      '<path fill="currentColor" d="' +
      LOGO_L_PATH +
      '"/></svg>' +
      "</span>"
    );
  }

  function navLinks(className) {
    var data = site();
    var items = (data && data.nav) || [];
    return items
      .map(function (item) {
        return (
          "<li><a href=\"" + esc(item.href) + '" class="' + className + '">' + esc(item.label) + "</a></li>"
        );
      })
      .join("");
  }

  function phoneLink(className, labelClass) {
    var data = site();
    var phone = data && data.contacts && data.contacts.phone;
    var href = telHref(phone);
    if (!href) return "";
    var label = labelClass
      ? '<span class="' + labelClass + '">' + esc(phone) + "</span>"
      : esc(phone);
    return (
      '<a class="' + className + '" href="' + esc(href) + '" aria-label="Позвонить: ' + esc(phone) + '">' +
      icon("phone") +
      label +
      "</a>"
    );
  }

  function render() {
    var data = site();
    if (!data || !data.brand) return "";
    var phone = data.contacts && data.contacts.phone;
    var mobilePhone = "";
    if (telHref(phone)) {
      mobilePhone =
        '<a class="header-mobile-phone" href="' + esc(telHref(phone)) + '">' +
        icon("phone") +
        "<span>" + esc(phone) + "</span></a>";
    }
    return (
      '<header id="site-header" class="site-header" data-block="header">' +
      '<div class="container-x header-inner">' +
      '<div class="header-shell">' +
      '<div class="header-bar">' +
      '<a href="#hero" class="header-logo" aria-label="' + esc(data.brand.name) + ' — на главную">' +
      logoHtml() +
      "</a>" +
      '<nav class="header-nav" aria-label="Разделы">' +
      '<ul class="header-nav-list">' + navLinks("header-nav-link") + "</ul>" +
      "</nav>" +
      '<div class="header-actions">' +
      phoneLink("header-phone", "header-phone-label") +
      '<a class="btn btn-primary header-cta" href="#request">Записаться</a>' +
      '<button type="button" class="header-menu-btn" id="header-menu-btn" aria-expanded="false" aria-controls="header-nav-mobile" aria-label="Открыть меню">' +
      '<span class="header-menu-icon">' + icon("menu") + "</span>" +
      '<span class="header-menu-close">' + icon("close") + "</span>" +
      "</button>" +
      "</div>" +
      "</div>" +
      '<nav id="header-nav-mobile" class="header-mobile-nav" hidden aria-label="Разделы">' +
      '<ul class="header-mobile-list">' + navLinks("header-mobile-link") + "</ul>" +
      '<div class="header-mobile-actions">' +
      '<a class="btn btn-primary header-cta" href="#request">Записаться</a>' +
      mobilePhone +
      "</div>" +
      "</nav>" +
      "</div>" +
      "</div>" +
      "</header>"
    );
  }

  function headerEl() {
    return document.getElementById("site-header");
  }

  function findTopbar(header) {
    var i;
    var el;
    for (i = 0; i < TOPBAR_SELECTORS.length; i += 1) {
      el = document.querySelector(TOPBAR_SELECTORS[i]);
      if (el && el !== header && !header.contains(el)) return el;
    }
    var nodes = document.querySelectorAll("body > *, #app > *");
    for (i = 0; i < nodes.length; i += 1) {
      el = nodes[i];
      if (!el || el === header || header.contains(el) || el.contains(header)) continue;
      if (el.matches && el.matches("main, footer, .cookie-banner, script, style")) continue;
      var style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "sticky") continue;
      var rect = el.getBoundingClientRect();
      if (rect.top <= 1 && rect.height > 8 && rect.height < 180 && rect.width > window.innerWidth * 0.5) {
        return el;
      }
    }
    return null;
  }

  function measuredTopbar(header) {
    var el = findTopbar(header);
    if (!el) return 0;
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return 0;
    if (style.position !== "fixed" && style.position !== "sticky") return 0;
    var rect = el.getBoundingClientRect();
    if (rect.top > 1 || rect.height < 8 || rect.height > 220) return 0;
    return Math.max(0, Math.ceil(rect.bottom));
  }

  function syncStick(header) {
    var measured = measuredTopbar(header);
    var root = document.documentElement;
    if (measured > 0) root.style.setProperty("--header-stick-top", measured + "px");
    else root.style.removeProperty("--header-stick-top");
  }

  function syncOffset(header) {
    var bar = header.querySelector(".header-bar") || header;
    var bottom = Math.ceil(bar.getBoundingClientRect().bottom);
    if (bottom < 0) bottom = 0;
    document.documentElement.style.setProperty("--header-offset", bottom + "px");
  }

  function syncActive(header) {
    var links = header.querySelectorAll(".header-nav-link, .header-mobile-link");
    var marker = 0;
    var raw = getComputedStyle(document.documentElement).getPropertyValue("--header-offset");
    var parsed = parseFloat(raw);
    if (isFinite(parsed)) marker = parsed + 8;
    var current = "";
    var seen = Object.create(null);
    Array.prototype.forEach.call(header.querySelectorAll(".header-nav-link"), function (link) {
      var href = link.getAttribute("href") || "";
      if (href.charAt(0) !== "#" || href.length < 2 || seen[href]) return;
      seen[href] = true;
      var section = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!section) return;
      if (section.getBoundingClientRect().top <= marker) current = href;
    });
    Array.prototype.forEach.call(links, function (link) {
      var on = current !== "" && link.getAttribute("href") === current;
      link.classList.toggle("is-active", on);
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function closeMenu(options) {
    var header = headerEl();
    if (!header) return;
    var menuBtn = document.getElementById("header-menu-btn");
    var mobileNav = document.getElementById("header-nav-mobile");
    var open = header.classList.contains("is-menu-open") || (mobileNav && !mobileNav.hidden);
    if (!open) return;
    if (mobileNav) mobileNav.hidden = true;
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Открыть меню");
    }
    header.classList.remove("is-menu-open");
    document.documentElement.classList.remove("header-menu-open");
    syncOffset(header);
    if (options && options.restoreFocus && menuBtn) menuBtn.focus({ preventScroll: true });
  }

  function openMenu(options) {
    var header = headerEl();
    var menuBtn = document.getElementById("header-menu-btn");
    var mobileNav = document.getElementById("header-nav-mobile");
    if (!header || !menuBtn || !mobileNav || NAV_DESKTOP.matches) return;
    mobileNav.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Закрыть меню");
    header.classList.add("is-menu-open");
    document.documentElement.classList.add("header-menu-open");
    syncOffset(header);
    if (options && options.focusFirst) {
      var first = mobileNav.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
  }

  function bind() {
    var header = headerEl();
    if (!header || header.dataset.bound === "true") return;
    header.dataset.bound = "true";

    var menuBtn = document.getElementById("header-menu-btn");
    var mobileNav = document.getElementById("header-nav-mobile");

    function syncChrome() {
      syncStick(header);
      syncOffset(header);
      syncActive(header);
    }

    syncChrome();
    header.classList.toggle("is-scrolled", window.scrollY > 8);

    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          header.classList.toggle("is-scrolled", window.scrollY > 8);
          syncStick(header);
          syncOffset(header);
          syncActive(header);
          ticking = false;
        });
      },
      { passive: true }
    );

    window.addEventListener("resize", function () {
      if (NAV_DESKTOP.matches) closeMenu();
      syncChrome();
    });

    if (window.ResizeObserver) {
      var observer = new ResizeObserver(function () {
        syncChrome();
      });
      observer.observe(header);
      var topbar = findTopbar(header);
      if (topbar) observer.observe(topbar);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        syncChrome();
      }).catch(function () {});
    }

    var mutation = new MutationObserver(function () {
      syncChrome();
    });
    var app = document.getElementById("app");
    if (app) mutation.observe(app, { childList: true, subtree: false });

    if (menuBtn) {
      menuBtn.addEventListener("click", function (event) {
        if (!mobileNav || mobileNav.hidden) openMenu({ focusFirst: event.detail === 0 });
        else closeMenu();
      });
    }

    header.addEventListener("click", function (event) {
      var link = event.target.closest("a[href^=\"#\"]");
      if (!link || !header.contains(link)) return;
      closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu({ restoreFocus: true });
    });

    document.addEventListener("click", function (event) {
      if (!header.contains(event.target)) closeMenu();
    });

    window.MLHeader.closeMenu = closeMenu;
  }

  window.MLHeader = {
    render: render,
    bind: bind,
    closeMenu: closeMenu,
  };
})();
