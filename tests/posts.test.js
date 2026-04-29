const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const postsDir = path.join(__dirname, '..', 'post');

describe('Blog Posts Regression Tests', () => {
  
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
  });

  test('24. Scrum post should have meta description', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const desc = $('meta[name="description"]').attr('content');
    expect(desc).toBeTruthy();
  });

  test('25. Scrum post should have article content', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const article = $('article');
    expect(article.length).toBeGreaterThan(0);
    expect(article.find('h1').length).toBeGreaterThan(0);
  });

  test('26. Scrum post should have Open Graph tags', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    expect($('meta[property="og:title"]').length).toBeGreaterThan(0);
    expect($('meta[property="og:description"]').length).toBeGreaterThan(0);
  });

  test('27. Scrum post should have author meta tag', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const author = $('meta[name="author"]').attr('content');
    expect(author).toBeTruthy();
    expect(author).toContain('Victor');
  });

  test('28. Scrum post should have related posts section', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const related = $('#related-posts');
    expect(related.length).toBeGreaterThan(0);
  });

  test('29. Scrum post should have comments section', () => {
    const scrumPath = path.join(postsDir, 'metodologia-scrum-com-automacao-de-testes', 'index.html');
    const html = fs.readFileSync(scrumPath, 'utf-8');
    const $ = cheerio.load(html);
    const comments = $('#comments');
    expect(comments.length).toBeGreaterThan(0);
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
  });

});
