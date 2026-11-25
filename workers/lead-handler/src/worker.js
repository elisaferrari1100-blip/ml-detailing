import {
  buildLeadHtml,
  buildLeadPlainText,
  buildTelegramHtml,
  formatPrice,
  normalizePayload,
} from "./format-lead.js";

const DEFAULT_ORIGINS =
  "https://mldetailing.ru,https://www.mldetailing.ru,https://elisaferrari1100-blip.github.io,http://127.0.0.1:8095,http://localhost:8095,http://127.0.0.1:8090,http://localhost:8090";

const FORMSUBMIT_ORIGIN = "https://mldetailing.ru";

// Актуальная версия из https://dev.vk.com/ru/reference/versions — не секрет.
const VK_API_VERSION = "5.199";
const VK_API_URL = "https://api.vk.com/method/messages.send";

function parseOrigins(env) {
  const raw = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).trim();
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = parseOrigins(env);
  const match = origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": match,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, X-Lead-Key",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(request, env, status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request, env) },
  });
}

function hasResend(env) {
  return Boolean(env.RESEND_API_KEY && env.LEAD_EMAIL_TO && env.LEAD_EMAIL_FROM);
}

function hasFormSubmit(env) {
  return Boolean(env.LEAD_EMAIL_TO && !env.RESEND_API_KEY);
}

function hasVk(env) {
  const token = String(env.VK_GROUP_TOKEN || "").trim();
  const peerId = String(env.VK_PEER_ID || "").trim();
  return Boolean(token && peerId);
}

function channelsConfigured(env) {
  const telegram = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
  const email = hasResend(env) || hasFormSubmit(env);
  const vk = hasVk(env);
  return { telegram, email, vk, any: telegram || email || vk };
}

function vkRandomId() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const id = buf[0] & 0x7fffffff;
  return id === 0 ? 1 : id;
}

function redactSecret(text, secret) {
  if (!text || !secret) return text || "";
  return String(text).split(secret).join("***");
}

async function sendVk(env, text) {
  const token = String(env.VK_GROUP_TOKEN).trim();
  const peerId = String(env.VK_PEER_ID).trim();
  const body = new URLSearchParams({
    peer_id: peerId,
    random_id: String(vkRandomId()),
    message: text,
    access_token: token,
    v: VK_API_VERSION,
  });
  const res = await fetch(VK_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(redactSecret(raw, token) || `VK ${res.status}`);
  }
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error("VK invalid json");
  }
  if (!data || data.error) {
    const code = data?.error?.error_code;
    const msg = data?.error?.error_msg || "VK error";
    throw new Error(redactSecret(code ? `${code} ${msg}` : msg, token));
  }
  if (data.response === undefined || data.response === null) {
    throw new Error("VK empty response");
  }
  return true;
}

async function sendTelegram(env, html) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Telegram ${res.status}`);
  }
  return true;
}

function buildFormSubmitBody(payload, subject) {
  const body = {
    _subject: subject,
    _template: "table",
    _captcha: false,
    Имя: payload.name,
    Телефон: payload.phone,
  };
  if (payload.car) body["Авто"] = payload.car;
  if (payload.items.length) {
    body["Услуги"] = payload.items
      .map((item) => {
        const price = item.price === null ? "по запросу" : `от ${formatPrice(item.price)}`;
        return `${item.group ? `${item.group}: ` : ""}${item.title} — ${price}`;
      })
      .join("; ");
  } else {
    body["Услуги"] = "не выбраны (только контакт)";
  }
  if (payload.total > 0) {
    body["Сумма (ориентир)"] = `от ${formatPrice(payload.total)}`;
  }
  if (payload.hasOnRequest) {
    body["Примечание"] = "Есть позиции «по запросу» — уточнить на осмотре.";
  }
  return body;
}

async function sendFormSubmit(env, subject, payload) {
  const to = encodeURIComponent(String(env.LEAD_EMAIL_TO).trim());
  const res = await fetch(`https://formsubmit.co/ajax/${to}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: FORMSUBMIT_ORIGIN,
      Referer: FORMSUBMIT_ORIGIN,
    },
    body: JSON.stringify(buildFormSubmitBody(payload, subject)),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `FormSubmit ${res.status}`);
  }
  return true;
}

async function sendResend(env, subject, html, text) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.LEAD_EMAIL_FROM,
      to: [env.LEAD_EMAIL_TO],
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Resend ${res.status}`);
  }
  return true;
}

async function sendEmail(env, subject, html, text, payload) {
  if (env.RESEND_API_KEY) {
    return sendResend(env, subject, html, text);
  }
  return sendFormSubmit(env, subject, payload);
}

function checkClientKey(request, env) {
  const expected = (env.LEAD_CLIENT_KEY || "").trim();
  if (!expected) return true;
  const got = (request.headers.get("X-Lead-Key") || "").trim();
  return got && got === expected;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "POST") {
      return jsonResponse(request, env, 405, { ok: false, error: "method_not_allowed" });
    }

    const { any: hasChannel } = channelsConfigured(env);
    if (!hasChannel) {
      return jsonResponse(request, env, 503, { ok: false, error: "handler_not_configured" });
    }

    if (!checkClientKey(request, env)) {
      return jsonResponse(request, env, 401, { ok: false, error: "unauthorized" });
    }

    let raw;
    try {
      raw = await request.json();
    } catch {
      return jsonResponse(request, env, 400, { ok: false, error: "invalid_json" });
    }

    const payload = normalizePayload(raw);
    if (!payload) {
      return jsonResponse(request, env, 400, { ok: false, error: "invalid_payload" });
    }

    const subject = `Заявка ML: ${payload.name}, ${payload.phone}`;
    const telegramHtml = buildTelegramHtml(payload);
    const emailHtml = buildLeadHtml(payload);
    const emailText = buildLeadPlainText(payload);

    const { telegram, email, vk } = channelsConfigured(env);
    const results = { telegram: false, email: false, vk: false };
    const errors = [];

    if (telegram) {
      try {
        await sendTelegram(env, telegramHtml);
        results.telegram = true;
      } catch (e) {
        errors.push(`telegram: ${e.message}`);
      }
    }

    if (email) {
      try {
        await sendEmail(env, subject, emailHtml, emailText, payload);
        results.email = true;
      } catch (e) {
        errors.push(`email: ${e.message}`);
      }
    }

    if (vk) {
      try {
        await sendVk(env, emailText);
        results.vk = true;
      } catch (e) {
        errors.push(`vk: ${e.message}`);
      }
    }

    const ok = results.telegram || results.email || results.vk;
    if (!ok) {
      return jsonResponse(request, env, 502, { ok: false, error: "delivery_failed", details: errors });
    }

    return jsonResponse(request, env, 200, { ok: true, ...results, warnings: errors.length ? errors : undefined });
  },
};
