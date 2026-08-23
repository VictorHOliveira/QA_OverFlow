const {
  formatDated,
  computeReadTime,
  parsePostDate,
  orderFields,
} = require("../src/utils/derive");
const { slugify } = require("../src/utils/slugify");
const { TRANSITIONS } = require("../src/services/posts.service");
const { createSchema, updateSchema } = require("../src/schemas/post.schema");
const Ajv = require("ajv");

describe("slugify", () => {
  test.each([
    ["Shift-Left + Shift-Right: O QA Senior", "shift-left-shift-right-o-qa-senior"],
    ["Automação de Testes em Python", "automacao-de-testes-em-python"],
    ["Cypress para Iniciantes!", "cypress-para-iniciantes"],
    ["Múltiplos   espaços_e_underscores", "multiplos-espacos-e-underscores"],
    ["---hífens---", "hifens"],
    ["", ""],
  ])("slugify(%j) -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe("formatDated", () => {
  test("formats date-only input at noon", () => {
    expect(formatDated("2026-05-04")).toBe("May 04, 2026 12:00 PM");
  });

  test("preserves time from ISO datetime", () => {
    expect(formatDated("2026-03-10T09:05:00")).toBe("March 10, 2026 09:05 AM");
    expect(formatDated("2026-04-24T20:35:00")).toBe("April 24, 2026 08:35 PM");
  });

  test("handles midnight and noon edge cases", () => {
    expect(formatDated("2026-01-01T00:30:00")).toBe("January 01, 2026 12:30 AM");
    expect(formatDated("2026-01-01T12:00:00")).toBe("January 01, 2026 12:00 PM");
  });
});

describe("computeReadTime", () => {
  test("short content minimum 1 min", () => {
    expect(computeReadTime("<p>oi</p>")).toBe("1 min");
  });

  test("400 words -> 2 min", () => {
    const html = `<p>${"palavra ".repeat(400)}</p>`;
    expect(computeReadTime(html)).toBe("2 min");
  });
});

describe("parsePostDate / orderFields", () => {
  test("parsePostDate rejects garbage", () => {
    expect(parsePostDate("nao-e-data")).toBeNull();
    expect(parsePostDate("2026-13-45")).toBeNull();
  });

  test("orderFields puts canonical fields first", () => {
    const out = orderFields({ content: "x", title: "t", author: "a", extra: 1 });
    expect(Object.keys(out)).toEqual(["author", "title", "content", "extra"]);
  });
});

describe("status transitions map", () => {
  test("enforces editorial flow", () => {
    expect(TRANSITIONS.draft).toEqual(["review"]);
    expect(TRANSITIONS.review).toEqual(["published", "draft"]);
    expect(TRANSITIONS.published).toEqual(["draft"]);
  });
});

describe("post schema", () => {
  const ajv = new Ajv({ allErrors: true });
  const validateCreate = ajv.compile(createSchema);
  const validateUpdate = ajv.compile(updateSchema);

  const valid = {
    title: "Titulo valido do post de teste",
    category: "boas-praticas",
    tags: ["qa"],
    summary: "Resumo suficientemente grande para passar.",
    description: "Descricao suficientemente grande para passar.",
    body: "Corpo curto porem maior que dez chars.",
    content: "<p>Conteudo com mais de cinquenta caracteres sem problema.</p>",
  };

  test("valid payload passes", () => {
    expect(validateCreate(valid)).toBe(true);
  });

  test("missing required fields fail with pointers", () => {
    const ok = validateCreate({ title: valid.title });
    expect(ok).toBe(false);
    const missing = validateCreate.errors
      .filter((e) => e.keyword === "required")
      .map((e) => e.params.missingProperty);
    expect(missing).toEqual(expect.arrayContaining(["category", "tags", "content"]));
  });

  test("rejects unknown properties (additionalProperties false)", () => {
    expect(validateCreate({ ...valid, hackerField: "x" })).toBe(false);
  });

  test("update schema allows partial but rejects bad types", () => {
    expect(validateUpdate({ tags: ["ok"] })).toBe(true);
    expect(validateUpdate({ tags: "not-an-array" })).toBe(false);
  });

  test("slug pattern enforced", () => {
    expect(validateUpdate({ slug: "Slug Com Espacos" })).toBe(false);
    expect(validateUpdate({ slug: "slug-valido-123" })).toBe(true);
  });
});
