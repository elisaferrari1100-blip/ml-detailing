/**
 * Каркас тела страницы: единый <main> и шаблон секций.
 *
 * Существующие разделы собирает js/app.js и пропускает через ML_BODY.compose.
 * Новый подраздел добавляется до запуска app.js:
 *
 *   ML_BODY.add({
 *     id: "warranty",          // якорь: #warranty
 *     after: "services",       // или before: "reviews"
 *     eyebrow: "Гарантия",
 *     title: "Заголовок",
 *     lead: "Короткий лид.",
 *     grid: "3",               // 2 | 3 | split; без поля — одна колонка
 *     body: "<article>...</article><article>...</article>",
 *   });
 *
 * Свой порядок разметки — полем html (готовый фрагмент внутри секции)
 * или variant: "bleed" и bleed: "..." для полноширинного ряда под заголовком.
 * id секции совпадает с якорем меню. Шапка, футер и юридические страницы
 * этим файлом не собираются.
 */
(function () {
  const registry = [];

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function classes() {
    return Array.from(arguments)
      .flat()
      .join(" ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function headingHtml(opts) {
    if (!opts.eyebrow && !opts.title && !opts.lead) return "";
    const titleId = opts.labelledBy || (opts.id ? `${opts.id}-title` : "section-title");
    return `<header class="page-section__head max-w-3xl">
      ${opts.eyebrow ? `<p class="page-section__eyebrow eyebrow mb-4">${esc(opts.eyebrow)}</p>` : ""}
      ${
        opts.title
          ? `<h2 id="${esc(titleId)}" class="page-section__title display text-[clamp(24px,3.6vw,46px)] font-semibold text-ink">${esc(opts.title)}</h2>`
          : ""
      }
      ${
        opts.lead
          ? `<p class="page-section__lead mt-5 text-base leading-relaxed text-chrome md:text-lg">${esc(opts.lead)}</p>`
          : ""
      }
    </header>`;
  }

  /**
   * Общий шаблон секции.
   * html — внутренняя разметка как есть (существующие разделы).
   * Без html секция собирается из заголовка, сетки body и необязательного bleed.
   */
  function section(opts) {
    const variant = opts.variant || "default";
    const className = classes(
      "page-section",
      variant !== "default" ? `page-section--${variant}` : "",
      "section",
      opts.className || ""
    );
    const labelled = opts.labelledBy ? ` aria-labelledby="${esc(opts.labelledBy)}"` : "";
    let inner = opts.html;
    if (inner == null) {
      const titleId = opts.labelledBy || `${opts.id}-title`;
      const grid = opts.grid ? ` page-section__grid--${String(opts.grid).replace(/[^a-z0-9-]/gi, "")}` : "";
      const body = opts.body ? `<div class="page-section__grid${grid}">${opts.body}</div>` : "";
      const bleed = opts.bleed ? `<div class="page-section__bleed">${opts.bleed}</div>` : "";
      inner = `${opts.backdrop || ""}<div class="page-section__inner container-x">${headingHtml({
        eyebrow: opts.eyebrow,
        title: opts.title,
        lead: opts.lead,
        labelledBy: titleId,
      })}${body}</div>${bleed}`;
    }
    return `<section id="${esc(opts.id)}"${labelled} class="${className}" data-page-section="${esc(opts.id)}">${inner}</section>`;
  }

  function band(html, name) {
    const attr = name ? ` data-page-band="${esc(name)}"` : "";
    return `<div class="page-band"${attr}>${html}</div>`;
  }

  function add(spec) {
    if (!spec || !spec.id) throw new Error("ML_BODY.add: укажите id секции");
    registry.push(spec);
  }

  function materialize(spec) {
    if (spec.html) return spec.html;
    return section({
      id: spec.id,
      labelledBy: spec.labelledBy || `${spec.id}-title`,
      variant: spec.variant,
      className: spec.className || "",
      eyebrow: spec.eyebrow,
      title: spec.title || "",
      lead: spec.lead,
      body: spec.body,
      grid: spec.grid,
      bleed: spec.bleed,
      backdrop: spec.backdrop,
    });
  }

  function place(list, spec, item) {
    if (spec.before) {
      const index = list.findIndex((block) => block.id === spec.before);
      if (index < 0) list.push(item);
      else list.splice(index, 0, item);
      return;
    }
    if (spec.after) {
      let index = list.findIndex((block) => block.id === spec.after);
      if (index < 0) {
        list.push(item);
        return;
      }
      index += 1;
      while (index < list.length && list[index].anchor === spec.after) index += 1;
      item.anchor = spec.after;
      list.splice(index, 0, item);
      return;
    }
    list.push(item);
  }

  function compose(blocks) {
    const list = (blocks || []).filter((block) => block && block.html);
    const seen = new Set(list.map((block) => block.id));
    registry.forEach((spec) => {
      if (seen.has(spec.id)) {
        console.warn(`ML_BODY: секция #${spec.id} уже есть, повтор не добавлен`);
        return;
      }
      seen.add(spec.id);
      place(list, spec, { id: spec.id, html: materialize(spec) });
    });
    return list.map((block) => block.html).join("");
  }

  window.ML_BODY = {
    add,
    section,
    band,
    compose,
    heading: headingHtml,
  };
})();
