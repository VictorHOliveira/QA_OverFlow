process.env.NODE_ENV = "test";
process.env.API_KEY = "test-key-123";

const request = require("supertest");
const { MemoryStore } = require("../../src/services/stores/memory.store");
const { createApp } = require("../../src/app");

const seedPost = (overrides = {}) => ({
  author: "Victor Oliveira",
  title: "Post de exemplo sobre automacao de testes",
  tags: ["qa", "automacao"],
  category: "boas-praticas",
  body: "Introducao do post de exemplo sobre automacao.",
  datePublished: "2026-01-15",
  dateModified: "2026-01-15",
  coverImage: "https://images.unsplash.com/photo-123?w=800",
  readTime: "5 min",
  dated: "January 15, 2026 12:00 PM",
  slug: "post-exemplo-automacao",
  categorySlug: "boas-praticas",
  status: "published",
  summary: "Resumo do post de exemplo para testes automatizados.",
  description: "Descricao SEO do post de exemplo para testes.",
  content: "<p>Conteudo completo do post de exemplo com mais de cinquenta caracteres.</p>",
  ...overrides,
});

function buildTestApp(seed = []) {
  const store = new MemoryStore(seed);
  const app = createApp({ store });
  return { app, store };
}

module.exports = { request, buildTestApp, seedPost, API_KEY: process.env.API_KEY };
