/* Верхняя плашка: телефон записи, адрес, часы и ВКонтакте из ML_SITE. */
(() => {
  const site = window.ML_SITE;
  if (!site || document.getElementById("site-topbar")) return;

  const contacts = site.contacts || {};
  const vk = site.social && site.social.vk;
  const phone = contacts.phone || "";
  const tel = phone.replace(/[^\d+]/g, "");
  const schedule = `${contacts.schedule || ""}${contacts.scheduleNote || ""}`.trim();

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const addressLink = contacts.address
    ? `<a class="site-topbar-address" href="${esc(contacts.yandexOrgUrl || "#about")}"${
        contacts.yandexOrgUrl ? ' target="_blank" rel="noopener noreferrer"' : ""
      }>${esc(contacts.address)}</a>`
    : "";
  const phoneLink = phone
    ? `<a class="site-topbar-phone" href="tel:${esc(tel)}"><span class="site-topbar-phone-label">Запись</span><span>${esc(phone)}</span></a>`
    : "";
  const vkLink =
    vk && vk.url
      ? `<a class="site-topbar-vk" href="${esc(vk.url)}" target="_blank" rel="noopener noreferrer me" aria-label="${esc(vk.title || "Мы ВКонтакте")}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.712-.576.712z"/></svg><span>ВКонтакте</span></a>`
      : "";

  const bar = document.createElement("div");
  bar.id = "site-topbar";
  bar.className = "site-topbar";
  bar.innerHTML = `<div class="site-topbar-inner"><p class="site-topbar-meta">${addressLink}${
    schedule ? `<span class="site-topbar-hours">${esc(schedule)}</span>` : ""
  }</p><p class="site-topbar-actions">${phoneLink}${vkLink}</p></div>`;

  const app = document.getElementById("app");
  if (app) app.prepend(bar);
  else document.body.prepend(bar);

  const syncOffset = () => {
    const topbarH = Math.ceil(bar.getBoundingClientRect().height);
    const header = document.getElementById("site-header");
    const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    const root = document.documentElement;
    root.style.setProperty("--topbar-offset", `${topbarH}px`);
    root.style.setProperty("--header-offset", `${headerH + topbarH}px`);
  };

  syncOffset();
  window.addEventListener("resize", syncOffset);
  window.addEventListener("scroll", () => requestAnimationFrame(syncOffset), { passive: true });
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(syncOffset);
    observer.observe(bar);
    const header = document.getElementById("site-header");
    if (header) observer.observe(header);
  }
})();
