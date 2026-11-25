/**
 * Тексты заявки для Telegram, ВКонтакте и почты (общая логика для воркера и тестов).
 */

export function formatPrice(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "по запросу";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(Number(n)))} ₽`;
}

export function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name ?? "").trim();
  const phone = String(raw.phone ?? "").trim();
  const car = String(raw.car ?? "").trim();
  const items = Array.isArray(raw.items) ? raw.items : [];
  const total = Number(raw.total) || 0;
  const hasOnRequest = Boolean(raw.hasOnRequest);
  if (name.length < 2 || !phone) return null;
  const cleanItems = items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      key: String(item.key ?? ""),
      title: String(item.title ?? "").trim(),
      group: String(item.group ?? "").trim(),
      price: item.price === null || item.price === undefined ? null : Number(item.price),
    }))
    .filter((item) => item.title);
  return { name, phone, car, items: cleanItems, total, hasOnRequest };
}

export function buildLeadLines(payload) {
  const lines = ["Новая заявка — ML Detailing", ""];
  lines.push(`Имя: ${payload.name}`);
  lines.push(`Телефон: ${payload.phone}`);
  if (payload.car) lines.push(`Авто: ${payload.car}`);
  if (payload.items.length) {
    lines.push("", "Услуги:");
    for (const item of payload.items) {
      const price = item.price === null ? "по запросу" : `от ${formatPrice(item.price)}`;
      lines.push(`• ${item.group ? `${item.group}: ` : ""}${item.title} — ${price}`);
    }
  } else {
    lines.push("", "Услуги: не выбраны (только контакт)");
  }
  if (payload.total > 0) {
    lines.push("", `Сумма (ориентир): от ${formatPrice(payload.total)}`);
  }
  if (payload.hasOnRequest) {
    lines.push("Есть позиции «по запросу» — уточнить на осмотре.");
  }
  return lines;
}

export function buildLeadPlainText(payload) {
  return buildLeadLines(payload).join("\n");
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildLeadHtml(payload) {
  const lines = buildLeadLines(payload);
  const body = lines
    .map((line) => (line === "" ? "<br>" : `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`))
    .join("\n");
  return `<!DOCTYPE html><html lang="ru"><body style="font-family:system-ui,sans-serif;line-height:1.45;color:#111">${body}</body></html>`;
}

export function buildTelegramHtml(payload) {
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const parts = ["<b>🆕 Заявка ML Detailing</b>", ""];
  parts.push(`<b>Имя:</b> ${esc(payload.name)}`);
  parts.push(`<b>Телефон:</b> ${esc(payload.phone)}`);
  if (payload.car) parts.push(`<b>Авто:</b> ${esc(payload.car)}`);
  if (payload.items.length) {
    parts.push("", "<b>Услуги:</b>");
    for (const item of payload.items) {
      const price = item.price === null ? "по запросу" : `от ${esc(formatPrice(item.price))}`;
      parts.push(`• ${esc(item.group ? `${item.group}: ` : "")}${esc(item.title)} — ${price}`);
    }
  }
  if (payload.total > 0) {
    parts.push("", `<b>Сумма (ориентир):</b> от ${esc(formatPrice(payload.total))}`);
  }
  if (payload.hasOnRequest) {
    parts.push("", "<i>Есть позиции «по запросу».</i>");
  }
  return parts.join("\n");
}