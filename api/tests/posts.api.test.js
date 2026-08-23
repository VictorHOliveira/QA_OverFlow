const { request, buildTestApp, seedPost, API_KEY } = require("./helpers/factory");

const auth = { "x-api-key": API_KEY };

const validPayload = {
  title: "Novo post sobre Cypress e mocks de rede",
  category: "ferramentas",
  tags: ["cypress", "mocks"],
  summary: "Como mockar requisicoes de rede no Cypress com facilidade.",
  description: "Guia pratico de interceptacao de rede no Cypress para testes E2E.",
  body: "Aprenda a interceptar e mockar chamadas HTTP nos seus testes E2E.",
  content: "<p>Conteudo completo ensinando cy.intercept com exemplos praticos de uso diario.</p>",
};

describe("Health", () => {
  test("GET /health returns ok", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /api/v1/posts", () => {
  const seed = [
    seedPost(),
    seedPost({ slug: "draft-post", title: "Rascunho ainda nao revisado", status: "draft" }),
    seedPost({ slug: "review-post", title: "Post em revisao agora", status: "review" }),
  ];

  test("lists posts without heavy fields and with url", async () => {
    const { app } = buildTestApp(seed);
    const res = await request(app).get("/api/v1/posts");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    for (const item of res.body.data) {
      expect(item.content).toBeUndefined();
      expect(item.body).toBeUndefined();
      expect(item.url).toMatch(/^https:\/\/qaoverflow\.com\/post\//);
    }
  });

  test("filters by status", async () => {
    const { app } = buildTestApp(seed);
    const res = await request(app).get("/api/v1/posts?status=draft");
    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.slug)).toEqual(["draft-post"]);
  });

  test("filters by multiple statuses (csv)", async () => {
    const { app } = buildTestApp(seed);
    const res = await request(app).get("/api/v1/posts?status=draft,review");
    expect(res.body.data).toHaveLength(2);
  });

  test("filters by tag and searches q", async () => {
    const { app } = buildTestApp(seed);
    const byTag = await request(app).get("/api/v1/posts?tag=automacao");
    expect(byTag.body.data).toHaveLength(3);
    const byQuery = await request(app).get("/api/v1/posts?q=revisado");
    expect(byQuery.body.data.map((p) => p.slug)).toEqual(["draft-post"]);
  });

  test("paginates", async () => {
    const { app } = buildTestApp(seed);
    const res = await request(app).get("/api/v1/posts?page=2&pageSize=2");
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.pagination).toMatchObject({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
  });

  test("returns full post by slug including content", async () => {
    const { app } = buildTestApp(seed);
    const res = await request(app).get("/api/v1/posts/post-exemplo-automacao");
    expect(res.status).toBe(200);
    expect(res.body.data.content).toContain("<p>");
  });

  test("404 for unknown slug", async () => {
    const { app } = buildTestApp();
    const res = await request(app).get("/api/v1/posts/nao-existe");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("POST /api/v1/posts", () => {
  test("401 without api key", async () => {
    const { app } = buildTestApp();
    const res = await request(app).post("/api/v1/posts").send(validPayload);
    expect(res.status).toBe(401);
  });

  test("403 with wrong api key", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/posts")
      .set("x-api-key", "wrong-key")
      .send(validPayload);
    expect(res.status).toBe(403);
  });

  test("creates draft with derived fields", async () => {
    const { app, store } = buildTestApp([seedPost()]);
    const res = await request(app)
      .post("/api/v1/posts")
      .set("x-api-key", API_KEY)
      .send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.slug).toBe("novo-post-sobre-cypress-e-mocks-de-rede");
    expect(res.body.data.categorySlug).toBe("ferramentas");
    expect(res.body.data.readTime).toMatch(/ min$/);
    expect(res.body.data.dated).toMatch(/^\w+ \d{2}, \d{4} \d{2}:\d{2} (AM|PM)$/);
    expect(store.posts.has(res.body.data.slug)).toBe(true);
    expect(store.order).toContain(res.body.data.slug);
  });

  test("accepts explicit datePublished and derives dated", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/posts")
      .set("x-api-key", API_KEY)
      .send({ ...validPayload, datePublished: "2026-03-10T09:05:00" });
    expect(res.body.data.dated).toBe("March 10, 2026 09:05 AM");
  });

  test("409 on duplicate slug", async () => {
    const { app } = buildTestApp([seedPost()]);
    const res = await request(app)
      .post("/api/v1/posts")
      .set("x-api-key", API_KEY)
      .send({ ...validPayload, slug: "post-exemplo-automacao" });
    expect(res.status).toBe(409);
  });

  test("422 with validation details on invalid payload", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/posts")
      .set("x-api-key", API_KEY)
      .send({ title: "curto" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("UNPROCESSABLE");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  test("rejects invalid coverImage URL", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/posts")
      .set("x-api-key", API_KEY)
      .send({ ...validPayload, coverImage: "ftp://nao-e-http" });
    expect(res.status).toBe(422);
  });
});

describe("PUT /api/v1/posts/:slug", () => {
  test("updates fields and bumps dateModified", async () => {
    const { app } = buildTestApp([seedPost()]);
    const res = await request(app)
      .put("/api/v1/posts/post-exemplo-automacao")
      .set("x-api-key", API_KEY)
      .send({ title: "Titulo atualizado do post de exemplo" });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toContain("atualizado");
    expect(res.body.data.slug).toBe("post-exemplo-automacao");
    expect(res.body.data.content).toContain("<p>");
  });

  test("400 when trying to set status directly", async () => {
    const { app } = buildTestApp([seedPost()]);
    const res = await request(app)
      .put("/api/v1/posts/post-exemplo-automacao")
      .set("x-api-key", API_KEY)
      .send({ status: "published" });
    expect(res.status).toBe(400);
  });

  test("404 for unknown slug", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .put("/api/v1/posts/nao-existe")
      .set("x-api-key", API_KEY)
      .send({ title: "Titulo qualquer para update" });
    expect(res.status).toBe(404);
  });
});

describe("Workflow transitions draft -> review -> published", () => {
  async function createDraft(app) {
    const res = await request(app)
      .post("/api/v1/posts")
      .set("x-api-key", API_KEY)
      .send(validPayload);
    return res.body.data;
  }

  test("full happy path", async () => {
    const { app } = buildTestApp([seedPost()]);
    const draft = await createDraft(app);

    const review = await request(app)
      .post(`/api/v1/posts/${draft.slug}/submit-review`)
      .set("x-api-key", API_KEY);
    expect(review.status).toBe(200);
    expect(review.body.data.status).toBe("review");

    const publish = await request(app)
      .post(`/api/v1/posts/${draft.slug}/publish`)
      .set("x-api-key", API_KEY);
    expect(publish.status).toBe(200);
    expect(publish.body.data.status).toBe("published");

    const fetched = await request(app).get(`/api/v1/posts/${draft.slug}`);
    expect(fetched.body.data.status).toBe("published");
  });

  test("cannot publish straight from draft", async () => {
    const { app } = buildTestApp([seedPost()]);
    const draft = await createDraft(app);
    const res = await request(app)
      .post(`/api/v1/posts/${draft.slug}/publish`)
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  test("unpublish returns published post to draft", async () => {
    const { app } = buildTestApp([seedPost()]);
    const res = await request(app)
      .post("/api/v1/posts/post-exemplo-automacao/unpublish")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("draft");
  });

  test("review can go back to draft", async () => {
    const { app } = buildTestApp([
      seedPost({ slug: "em-revisao", title: "Post em revisao para voltar", status: "review" }),
    ]);
    const backToDraft = await request(app)
      .post("/api/v1/posts/em-revisao/unpublish")
      .set("x-api-key", API_KEY);
    expect(backToDraft.body.data.status).toBe("draft");
  });
});

describe("DELETE /api/v1/posts/:slug", () => {
  test("removes post", async () => {
    const { app, store } = buildTestApp([seedPost()]);
    const res = await request(app)
      .delete("/api/v1/posts/post-exemplo-automacao")
      .set("x-api-key", API_KEY);
    expect(res.status).toBe(200);
    expect(store.posts.has("post-exemplo-automacao")).toBe(false);
    const after = await request(app).get("/api/v1/posts/post-exemplo-automacao");
    expect(after.status).toBe(404);
  });
});

describe("Taxonomy endpoints", () => {
  test("GET /api/v1/taxonomy/categories aggregates counts", async () => {
    const { app } = buildTestApp([
      seedPost(),
      seedPost({ slug: "outro-post", title: "Outro post qualquer aqui", category: "ferramentas", categorySlug: "ferramentas" }),
    ]);
    const res = await request(app).get("/api/v1/taxonomy/categories");
    expect(res.status).toBe(200);
    const cats = Object.fromEntries(res.body.data.map((c) => [c.slug, c.count]));
    expect(cats["boas-praticas"]).toBe(1);
    expect(cats["ferramentas"]).toBe(1);
  });

  test("GET /api/v1/taxonomy/tags aggregates counts sorted desc", async () => {
    const { app } = buildTestApp([
      seedPost(),
      seedPost({ slug: "outro", title: "Segundo post de teste", tags: ["qa", "robot"] }),
    ]);
    const res = await request(app).get("/api/v1/taxonomy/tags");
    expect(res.body.data[0]).toEqual({ tag: "qa", count: 2 });
  });
});

describe("Media upload", () => {
  test("uploads image and returns URL", async () => {
    const { app, store } = buildTestApp();
    const fakePng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = await request(app)
      .post("/api/v1/media/upload")
      .set("x-api-key", API_KEY)
      .attach("file", fakePng, { filename: "capa do post.png", contentType: "image/png" });
    expect(res.status).toBe(201);
    expect(res.body.data.url).toMatch(/images\/uploads\/\d{4}\/capa-do-post-\d+\.png$/);
    expect(store.images).toHaveLength(1);
  });

  test("rejects non-image mime types", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/media/upload")
      .set("x-api-key", API_KEY)
      .attach("file", Buffer.from("<html>oi</html>"), { filename: "pagina.html", contentType: "text/html" });
    expect(res.status).toBe(400);
  });

  test("requires auth", async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post("/api/v1/media/upload")
      .attach("file", Buffer.from("x"), { filename: "a.png", contentType: "image/png" });
    expect(res.status).toBe(401);
  });
});
