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

describe("worker fetch", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("api.telegram.org")) {
        assert.match(String(url), /test-token/);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (String(url).includes("api.resend.com")) {
        assert.equal(init.method, "POST");
        return new Response(JSON.stringify({ id: "msg_1" }), { status: 200 });
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

  it("POST отправляет telegram и email", async () => {
    const req = new Request("https://worker.test/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Lead-Key": "secret-key",
        Origin: "https://mldetailing.ru",
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
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.telegram, true);
    assert.equal(body.email, true);
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