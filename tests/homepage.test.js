const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf-8');
const $ = cheerio.load(html);

describe('Homepage Regression Tests', () => {
  
  test('1. Homepage should have a valid HTML structure', () => {
    expect($('html').length).toBe(1);
    expect($('head').length).toBe(1);
    expect($('body').length).toBe(1);
  });

  test('2. Homepage should have a title tag', () => {
    const title = $('title').text();
    expect(title).toBeTruthy();
    expect(title).toContain('QA Overflow');
  });

  test('3. Homepage should have meta charset UTF-8', () => {
    const charset = $('meta[charset]').attr('charset');
    expect(charset.toLowerCase()).toBe('utf-8');
  });

  test('4. Homepage should have viewport meta tag', () => {
    const viewport = $('meta[name="viewport"]').attr('content');
    expect(viewport).toContain('width=device-width');
  });

  test('5. Homepage should have exactly 4 articles in main content', () => {
    const articles = $('.main-content article');
    expect(articles.length).toBe(4);
  });

  test('6. Homepage should contain Scrum post link in main content', () => {
    const scrumLink = $('.main-content a[href*="metodologia-scrum"]');
    expect(scrumLink.length).toBeGreaterThan(0);
    expect(scrumLink.text()).toContain('Metodologia Scrum');
  });

  test('7. Homepage should contain Identificar Testes post link', () => {
    const link = $('.main-content a[href*="identificar-testes-manuais"]');
    expect(link.length).toBeGreaterThan(0);
  });

  test('8. Homepage should contain Design Patterns post link', () => {
    const link = $('.main-content a[href*="design-patterns"]');
    expect(link.length).toBeGreaterThan(0);
  });

  test('9. Homepage should contain Boas Práticas post link', () => {
    const link = $('.main-content a[href*="boas-pr"]');
    expect(link.length).toBeGreaterThan(0);
  });

  test('10. Sidebar should have Postagens Recentes section', () => {
    const sidebarTitle = $('.sidebar .panel-heading:contains("Postagens Recentes")');
    expect(sidebarTitle.length).toBeGreaterThan(0);
  });

  test('11. Sidebar should have Scrum post in recent posts', () => {
    const links = $('.sidebar .list-group-item a[href*="metodologia-scrum"]');
    expect(links.length).toBeGreaterThan(0);
  });

  test('12. Sidebar should have exactly 3 recent posts', () => {
    const items = $('.sidebar .panel:contains("Postagens Recentes") .list-group-item');
    expect(items.length).toBe(3);
  });

  test('13. Homepage should have header navigation', () => {
    const nav = $('.navbar-nav');
    expect(nav.length).toBeGreaterThan(0);
  });

  test('14. Homepage should have search input', () => {
    const searchInput = $('.searchQuery');
    expect(searchInput.length).toBeGreaterThan(0);
  });

  test('15. Homepage should load Bootstrap CSS', () => {
    const bootstrap = $('link[href*="bootstrap"]');
    expect(bootstrap.length).toBeGreaterThan(0);
  });

  test('16. Homepage should load jQuery', () => {
    const jquery = $('script[src*="jquery"]');
    expect(jquery.length).toBeGreaterThan(0);
  });

  test('17. Footer should contain QA Overflow reference', () => {
    const footer = $('footer').text();
    expect(footer).toContain('QA Overflow');
  });

  test('18. All article links should have valid href attributes', () => {
    const links = $('.main-content article a[href]');
    links.each((i, el) => {
      const href = $(el).attr('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);
    });
  });

  test('19. Homepage should have Open Graph meta tags', () => {
    const ogTitle = $('meta[property="og:title"]');
    expect(ogTitle.length).toBeGreaterThan(0);
  });

  test('20. Homepage should not have duplicate articles', () => {
    const titles = [];
    $('.main-content article h3 a').each((i, el) => {
      const title = $(el).text();
      expect(titles).not.toContain(title);
      titles.push(title);
    });
  });

});
