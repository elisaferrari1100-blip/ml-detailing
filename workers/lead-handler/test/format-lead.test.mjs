import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLeadPlainText,
  buildTelegramHtml,
  normalizePayload,
} from "../src/format-lead.js";

describe("normalizePayload", () => {
  it("принимает валидную заявку", () => {
    const p = normalizePayload({
      name: "Иван",
      phone: "+7 (999) 111-22-33",
      car: "Mazda 6",
      items: [{ title: "Тонировка", group: "Тонировка", price: 2700 }],
      total: 2700,
      hasOnRequest: false,
    });
    assert.ok(p);
    assert.equal(p.name, "Иван");
    assert.equal(p.items.length, 1);
  });

  it("отклоняет пустое имя", () => {
    assert.equal(normalizePayload({ name: "A", phone: "+7" }), null);
  });
});

describe("buildLeadPlainText", () => {
  it("содержит ключевые поля", () => {
    const text = buildLeadPlainText({
      name: "Иван",
      phone: "+7 (999) 111-22-33",
      car: "",
      items: [],
      total: 0,
      hasOnRequest: false,
    });
    assert.match(text, /Иван/);
    assert.match(text, /999/);
  });
});

describe("buildTelegramHtml", () => {
  it("экранирует HTML", () => {
    const html = buildTelegramHtml({
      name: "<test>",
      phone: "+7",
      car: "",
      items: [],
      total: 0,
      hasOnRequest: false,
    });
    assert.match(html, /&lt;test&gt;/);
  });
});