import {
  buildLeadHtml,
  buildLeadPlainText,
  buildTelegramHtml,
  normalizePayload,
} from "./format-lead.js";

const DEFAULT_ORIGINS =
  "https://mldetailing.ru,https://www.mldetailing.ru,https://elisaferrari1100-blip.github.io,http://127.0.0.1:8095,http://localhost:8095,http://127.0.0.1:8090,http://localhost:8090";

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

function channelsConfigured(env) {
  const telegram = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
  const email = Boolean(env.RESEND_API_KEY && env.LEAD_EMAIL_TO && env.LEAD_EMAIL_FROM);
  return { telegram, email, any: telegram || email };
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

async function sendEmail(env, subject, html, text) {
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

    const { telegram, email } = channelsConfigured(env);
    const results = { telegram: false, email: false };
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
        await sendEmail(env, subject, emailHtml, emailText);
        results.email = true;
      } catch (e) {
        errors.push(`email: ${e.message}`);
      }
    }

    const ok = results.telegram || results.email;
    if (!ok) {
      return jsonResponse(request, env, 502, { ok: false, error: "delivery_failed", details: errors });
    }

    return jsonResponse(request, env, 200, { ok: true, ...results, warnings: errors.length ? errors : undefined });
  },
};