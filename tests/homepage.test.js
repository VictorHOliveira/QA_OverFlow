const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const indexPath = path.join(__dirname, '..', '_site', 'index.html');
const html = fs.readFileSync(indexPath, 'utf-8');
const $ = cheerio.load(html);

describe('Homepage Regression Tests (Eleventy _site)', () => {

  test('1. Homepage should have a valid HTML structure', () => {
    expect($('html').length).toBe(1);
    expect($('head').length).toBe(1);
    expect($('body').length).toBe(1);
  });

  test('2. Homepage should have correct title', () => {
    const title = $('title').text();
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

  test('5. Homepage should have meta description with tagline', () => {
    const desc = $('meta[name="description"]').attr('content');
    expect(desc).toContain('Qualidade de Software');
  });

    test('6. Homepage should have 13 published post cards', () => {
        const cards = $('#postsContainer .card');
        expect(cards.length).toBe(13);
  });

  test('7. Homepage should contain Scrum post link', () => {
    const scrumLink = $('a[href*="metodologia-scrum"]');
    expect(scrumLink.length).toBeGreaterThan(0);
    expect(scrumLink.text()).toContain('Metodologia Scrum');
  });

  test('8. Homepage should contain Design Patterns post link', () => {
    const link = $('a[href*="design-patterns"]');
    expect(link.length).toBeGreaterThan(0);
  });

  test('9. Homepage should contain Boas Práticas post link', () => {
    const link = $('a[href*="boas-pr"]');
    expect(link.length).toBeGreaterThan(0);
  });

  test('10. Homepage should contain Shift-Left post link', () => {
    const link = $('a[href*="shift-left"]');
    expect(link.length).toBeGreaterThan(0);
  });

  test('11. Homepage should have header navigation', () => {
    const nav = $('.navbar-nav');
    expect(nav.length).toBeGreaterThan(0);
  });

  test('12. Homepage sidebar should show post count', () => {
    const stats = $('.card:contains("Estatísticas")');
    expect(stats.length).toBeGreaterThan(0);
    expect(stats.text()).toContain('posts publicados');
  });

  test('13. Homepage sidebar should list categories', () => {
    const categories = $('.card:contains("Categorias")');
    expect(categories.length).toBeGreaterThan(0);
  });

  test('14. Homepage sidebar should list tags', () => {
    const tags = $('.card:contains("Tags Populares")');
    expect(tags.length).toBeGreaterThan(0);
  });

  test('15. Homepage should load Bootstrap 5 CSS', () => {
    const bootstrap = $('link[href*="bootstrap@5"]');
    expect(bootstrap.length).toBeGreaterThan(0);
  });

  test('16. Homepage should have Open Graph meta tags', () => {
    const ogTitle = $('meta[property="og:title"]');
    expect(ogTitle.length).toBeGreaterThan(0);
    expect($('meta[property="og:description"]').attr('content')).toBeTruthy();
    expect($('meta[property="og:image"]').attr('content')).toBeTruthy();
  });

  test('17. Homepage should have Twitter Card meta tags', () => {
    expect($('meta[name="twitter:card"]').attr('content')).toBe('summary_large_image');
  });

  test('18. Footer should contain QA Overflow reference', () => {
    const footer = $('footer').text();
    expect(footer).toContain('QA Overflow');
  });

  test('19. Homepage should have JSON-LD WebSite schema', () => {
    const jsonLd = $('script[type="application/ld+json"]').html();
    expect(jsonLd).toBeTruthy();
    const data = JSON.parse(jsonLd);
    expect(data['@type']).toBe('WebSite');
    expect(data.name).toBe('QA Overflow');
  });

  test('20. Homepage should not have duplicate post cards', () => {
    const titles = [];
    $('#postsContainer h2 a').each((i, el) => {
      const title = $(el).text();
      expect(titles).not.toContain(title);
      titles.push(title);
    });
  });

  test('21. Homepage should have canonical link', () => {
    const canonical = $('link[rel="canonical"]').attr('href');
    expect(canonical).toBe('https://qaoverflow.com/');
  });

});
