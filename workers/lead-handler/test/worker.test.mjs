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

const vkEnv = {
  ...env,
  VK_GROUP_TOKEN: "vk-group-token",
  VK_PEER_ID: " 2000000015 ",
};

const modes = {
  telegram: "ok",
  resend: "ok",
  formsubmit: "ok",
  vk: "ok",
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
    modes.telegram = "ok";
    modes.resend = "ok";
    modes.formsubmit = "ok";
    modes.vk = "ok";
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      const href = String(url);
      requests.push({ url: href, init });
      if (href.includes("api.telegram.org")) {
        assert.match(href, /test-token/);
        if (modes.telegram === "http") return new Response("tg down", { status: 500 });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      if (href.includes("api.resend.com")) {
        assert.equal(init.method, "POST");
        if (modes.resend === "http") return new Response("resend down", { status: 500 });
        return new Response(JSON.stringify({ id: "msg_1" }), { status: 200 });
      }
      if (href.includes("formsubmit.co")) {
        if (modes.formsubmit === "http") return new Response("form down", { status: 500 });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (href.includes("api.vk.com")) {
        if (modes.vk === "http") return new Response("vk-group-token leaked", { status: 500 });
        if (modes.vk === "api") {
          return new Response(
            JSON.stringify({
              error: { error_code: 901, error_msg: "Can't send messages for users without permission" },
            }),
            { status: 200 },
          );
        }
        if (modes.vk === "empty") return new Response("{}", { status: 200 });
        return new Response(JSON.stringify({ response: 77 }), { status: 200 });
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
    assert.equal(body.vk, false);
    assert.ok(requests.some((r) => r.url.includes("api.resend.com")));
    assert.equal(
      requests.some((r) => r.url.includes("formsubmit.co")),
      false,
    );
    assert.equal(
      requests.some((r) => r.url.includes("api.vk.com")),
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
    assert.equal(body.vk, false);

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

  it("без обоих секретов ВК канал выключен", async () => {
    const onlyToken = await worker.fetch(leadRequest(), { ...env, VK_GROUP_TOKEN: "vk-group-token" });
    assert.equal(onlyToken.status, 200);
    assert.equal((await onlyToken.json()).vk, false);

    requests.length = 0;
    const onlyPeer = await worker.fetch(leadRequest(), { ...env, VK_PEER_ID: "123" });
    assert.equal(onlyPeer.status, 200);
    assert.equal((await onlyPeer.json()).vk, false);
    assert.equal(
      requests.some((r) => r.url.includes("api.vk.com")),
      false,
    );
  });

  it("без единого канала отвечает 503", async () => {
    const res = await worker.fetch(leadRequest(), { VK_GROUP_TOKEN: "only-token" });
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error, "handler_not_configured");
    assert.equal(requests.length, 0);
  });

  it("шлёт заявку в сообщения сообщества и не кладёт ключ в адрес", async () => {
    const res = await worker.fetch(leadRequest(), vkEnv);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.telegram, true);
    assert.equal(body.email, true);
    assert.equal(body.vk, true);

    const vkCalls = requests.filter((r) => r.url.includes("api.vk.com"));
    assert.equal(vkCalls.length, 1);
    const vkReq = vkCalls[0];
    assert.equal(vkReq.url, "https://api.vk.com/method/messages.send");
    assert.equal(vkReq.url.includes("vk-group-token"), false);
    assert.equal(vkReq.init.method, "POST");
    assert.equal(vkReq.init.headers["Content-Type"], "application/x-www-form-urlencoded");

    const params = new URLSearchParams(vkReq.init.body);
    assert.equal(params.get("access_token"), "vk-group-token");
    assert.equal(params.get("peer_id"), "2000000015");
    assert.equal(params.get("v"), "5.199");
    const randomId = Number(params.get("random_id"));
    assert.equal(Number.isSafeInteger(randomId), true);
    assert.equal(randomId > 0 && randomId <= 2147483647, true);
    assert.match(params.get("message"), /Марина/);
    assert.match(params.get("message"), /BMW X5/);
    assert.match(params.get("message"), /Тонировка/);
  });

  it("два сообщения получают разные random_id", async () => {
    await worker.fetch(leadRequest(), vkEnv);
    await worker.fetch(leadRequest(), vkEnv);
    const ids = requests
      .filter((r) => r.url.includes("api.vk.com"))
      .map((r) => new URLSearchParams(r.init.body).get("random_id"));
    assert.equal(ids.length, 2);
    assert.notEqual(ids[0], ids[1]);
  });

  it("ошибка ВК не отменяет Telegram и почту", async () => {
    modes.vk = "api";
    const res = await worker.fetch(leadRequest(), vkEnv);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.telegram, true);
    assert.equal(body.email, true);
    assert.equal(body.vk, false);
    assert.ok(body.warnings.some((line) => line.startsWith("vk:")));
    assert.match(body.warnings.join("\n"), /901/);
  });

  it("ответ ВК с ключом в тексте ошибки не отдаёт секрет наружу", async () => {
    modes.vk = "http";
    const res = await worker.fetch(leadRequest(), vkEnv);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.vk, false);
    assert.equal(JSON.stringify(body).includes("vk-group-token"), false);
    assert.match(body.warnings.join("\n"), /\*\*\*/);
  });

  it("сбой Telegram и почты не мешает доставке во ВК", async () => {
    modes.telegram = "http";
    modes.resend = "http";
    const res = await worker.fetch(leadRequest(), vkEnv);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.telegram, false);
    assert.equal(body.email, false);
    assert.equal(body.vk, true);
    assert.equal(body.warnings.length, 2);
  });

  it("если не дошёл ни один канал — 502", async () => {
    modes.telegram = "http";
    modes.resend = "http";
    modes.vk = "empty";
    const res = await worker.fetch(leadRequest(), vkEnv);
    assert.equal(res.status, 502);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error, "delivery_failed");
    assert.equal(body.details.length, 3);
  });

  it("одного ВК достаточно, чтобы принять заявку", async () => {
    const res = await worker.fetch(leadRequest(), {
      VK_GROUP_TOKEN: "vk-group-token",
      VK_PEER_ID: "12345",
      LEAD_CLIENT_KEY: "secret-key",
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { ok: true, telegram: false, email: false, vk: true });
    assert.equal(
      requests.some((r) => r.url.includes("api.telegram.org") || r.url.includes("formsubmit.co") || r.url.includes("api.resend.com")),
      false,
    );
  });
});
