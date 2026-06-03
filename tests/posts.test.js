const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const postsDir = path.join(__dirname, '..', '_site', 'post');

describe('Blog Posts Regression Tests (Eleventy _site)', () => {

  test('21. Scrum post HTML file should exist', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    expect(fs.existsSync(scrumPath)).toBe(true);
  });

  test('22. Scrum post should have valid HTML structure', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    expect($('html').length).toBe(1);
    expect($('head').length).toBe(1);
    expect($('body').length).toBe(1);
  });

  test('23. Scrum post should have correct title', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const title = $('title').text();
    expect(title).toContain('Metodologia Scrum');
    expect(title).toContain('QA Overflow');
  });

  test('24. Scrum post should have meta description', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const desc = $('meta[name="description"]').attr('content');
    expect(desc).toBeTruthy();
    expect(desc).toContain('Metodologia Scrum');
  });

  test('25. Scrum post should have article with heading', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const article = $('article');
    expect(article.length).toBeGreaterThan(0);
    const h1 = article.find('h1');
    expect(h1.length).toBeGreaterThan(0);
    expect(h1.text()).toContain('Metodologia Scrum');
  });

  test('26. Scrum post should have Open Graph tags', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    expect($('meta[property="og:title"]').length).toBeGreaterThan(0);
    expect($('meta[property="og:description"]').attr('content')).toBeTruthy();
    expect($('meta[property="og:type"]').attr('content')).toBe('article');
  });

  test('27. Scrum post should have author meta tag', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const author = $('meta[name="author"]').attr('content');
    expect(author).toBeTruthy();
    expect(author).toContain('Victor');
  });

  test('28. Scrum post should have sharing buttons', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const shareLinks = $('.share-links');
    expect(shareLinks.length).toBeGreaterThan(0);
    expect(shareLinks.find('a').length).toBeGreaterThanOrEqual(3);
  });

  test('29. Scrum post should have author sidebar', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const authorCard = $('.card:contains("Sobre o Autor")');
    expect(authorCard.length).toBeGreaterThan(0);
    expect(authorCard.text()).toContain('QA Senior');
  });

  test('30. Scrum post should have valid JSON-LD structured data', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const jsonLd = $('script[type="application/ld+json"]').html();
    expect(jsonLd).toBeTruthy();
    const data = JSON.parse(jsonLd);
    expect(data['@type']).toBe('BlogPosting');
    expect(data.headline).toBeTruthy();
    expect(data.datePublished).toBeTruthy();
    expect(data.author.name).toBe('Victor Oliveira');
  });

  test('31. Scrum post should have canonical link', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const canonical = $('link[rel="canonical"]').attr('href');
    expect(canonical).toContain('metodologia-scrum');
  });

  test('32. Scrum post should have post content with paragraphs', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const content = $('.post-content');
    expect(content.length).toBeGreaterThan(0);
    expect(content.find('p').length).toBeGreaterThan(0);
  });

  test('33. Scrum post should display tags', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const tagBadges = $('.badge:contains("scrum")');
    expect(tagBadges.length).toBeGreaterThan(0);
  });

});
