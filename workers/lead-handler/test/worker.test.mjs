import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import worker from "../src/worker.js";

const env = {
  TELEGRAM_BOT_TOKEN: "test-token",
  TELEGRAM_CHAT_ID: "123",
  RESEND_API_KEY: "re_test",
  LEAD_EMAIL_TO: "owner@example.com",
  LEAD_EMAIL_FROM: "ML <notify@example.com>",
  LEAD_CLIENT_KEY: "secret-key",
};

const formSubmitEnv = {
  TELEGRAM_BOT_TOKEN: "test-token",
  TELEGRAM_CHAT_ID: "123",
  LEAD_EMAIL_TO: "danya.becketov@yandex.ru",
  LEAD_CLIENT_KEY: "secret-key",
};

function leadRequest(extraHeaders = {}) {
  return new Request("https://worker.test/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Lead-Key": "secret-key",
      Origin: "https://mldetailing.ru",
      ...extraHeaders,
    },
    body: JSON.stringify({
      name: "Марина",
      phone: "+7 (999) 120-44-88",
      car: "BMW X5",
      items: [{ title: "Тонировка", group: "Тонировка", price: 5000 }],
      total: 5000,
      hasOnRequest: false,
    }),
  });
}

describe("worker fetch", () => {
  let originalFetch;
  let requests;

  beforeEach(() => {
    requests = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      const href = String(url);
      requests.push({ url: href, init });
      if (href.includes("api.telegram.org")) {
        assert.match(href, /test-token/);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (href.includes("api.resend.com")) {
        assert.equal(init.method, "POST");
        return new Response(JSON.stringify({ id: "msg_1" }), { status: 200 });
      }
      if (href.includes("formsubmit.co")) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return originalFetch(url, init);
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("OPTIONS возвращает CORS", async () => {
    const req = new Request("https://worker.test/", {
      method: "OPTIONS",
      headers: { Origin: "https://mldetailing.ru" },
    });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "https://mldetailing.ru");
  });

  it("разрешает Origins сайта и GitHub Pages", async () => {
    for (const origin of [
      "https://mldetailing.ru",
      "https://www.mldetailing.ru",
      "https://elisaferrari1100-blip.github.io",
    ]) {
      const req = new Request("https://worker.test/", {
        method: "OPTIONS",
        headers: { Origin: origin },
      });
      const res = await worker.fetch(req, { ...env, ALLOWED_ORIGINS: undefined });
      assert.equal(res.status, 204);
      assert.equal(res.headers.get("Access-Control-Allow-Origin"), origin);
    }
  });

  it("POST отправляет telegram и email через Resend", async () => {
    const res = await worker.fetch(leadRequest(), env);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.telegram, true);
    assert.equal(body.email, true);
    assert.ok(requests.some((r) => r.url.includes("api.resend.com")));
    assert.equal(
      requests.some((r) => r.url.includes("formsubmit.co")),
      false,
    );
  });

  it("без RESEND_API_KEY шлёт почту через FormSubmit", async () => {
    const res = await worker.fetch(leadRequest(), formSubmitEnv);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.telegram, true);
    assert.equal(body.email, true);

    const fsReq = requests.find((r) => r.url.includes("formsubmit.co"));
    assert.ok(fsReq, "ожидался запрос к FormSubmit");
    assert.equal(fsReq.url, "https://formsubmit.co/ajax/danya.becketov%40yandex.ru");
    assert.equal(fsReq.init.method, "POST");
    const headers = fsReq.init.headers;
    assert.equal(headers["Content-Type"], "application/json");
    assert.equal(headers.Accept, "application/json");
    assert.equal(headers.Origin, "https://mldetailing.ru");
    assert.equal(headers.Referer, "https://mldetailing.ru");

    const payload = JSON.parse(fsReq.init.body);
    assert.equal(payload._subject, "Заявка ML: Марина, +7 (999) 120-44-88");
    assert.equal(payload._template, "table");
    assert.equal(payload._captcha, false);
    assert.equal(payload["Имя"], "Марина");
    assert.equal(payload["Телефон"], "+7 (999) 120-44-88");
    assert.equal(payload["Авто"], "BMW X5");
    assert.match(payload["Услуги"], /Тонировка/);
    assert.match(payload["Сумма (ориентир)"], /5/);

    assert.equal(
      requests.some((r) => r.url.includes("api.resend.com")),
      false,
    );
  });

  it("отклоняет без ключа", async () => {
    const req = new Request("https://worker.test/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", phone: "+7 999" }),
    });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 401);
  });
});
