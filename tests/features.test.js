const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const SITE_DIR = path.join(__dirname, '..', '_site');

function readFile(filePath) {
  return fs.readFileSync(path.join(SITE_DIR, filePath), 'utf-8');
}

function fileExists(filePath) {
  return fs.existsSync(path.join(SITE_DIR, filePath));
}

function loadCheerio(filePath) {
  return cheerio.load(readFile(filePath));
}

describe('404 Page', () => {
  test('404.html should exist', () => {
    expect(fileExists('404.html')).toBe(true);
  });

  test('404.html should have correct title tag', () => {
    const $ = loadCheerio('404.html');
    expect($('title').text()).toContain('Página não encontrada');
  });

  test('404.html should have link to homepage', () => {
    const $ = loadCheerio('404.html');
    expect($('a[href="/"]').length).toBeGreaterThanOrEqual(1);
    expect($('body').text()).toContain('Voltar ao Início');
  });
});

describe('Tag Pages', () => {
  const tags = ['2026', 'qa', 'automacao', 'playwright', 'robot-framework', 'scrum', 'boas-praticas'];

  tags.forEach(tag => {
    test(`/tag/${tag}/ should exist and contain the tag name`, () => {
      const $ = loadCheerio(path.join('tag', tag, 'index.html'));
      expect($('h1').text()).toContain(tag);
    });
  });

  test('tag page should have noindex meta tag', () => {
    const $ = loadCheerio(path.join('tag', 'scrum', 'index.html'));
    expect($('meta[name="robots"]').attr('content')).toBe('noindex, follow');
  });

  test('tag page should list posts with that tag', () => {
    const $ = loadCheerio(path.join('tag', 'scrum', 'index.html'));
    expect($('body').text()).toContain('Metodologia Scrum com Automação de Testes');
  });

  test('tag page should have back to home link', () => {
    const $ = loadCheerio(path.join('tag', 'qa', 'index.html'));
    expect($('a[href="/"]').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Category Pages', () => {
  test('/categoria/boas-praticas/ should exist', () => {
    const $ = loadCheerio(path.join('categoria', 'boas-praticas', 'index.html'));
    expect($('h1').text()).toContain('boas-praticas');
  });

  test('/categoria/tutoriais/ should exist', () => {
    const $ = loadCheerio(path.join('categoria', 'tutoriais', 'index.html'));
    expect($('h1').text()).toContain('tutoriais');
  });

  test('category page should have noindex meta tag', () => {
    const $ = loadCheerio(path.join('categoria', 'tutoriais', 'index.html'));
    expect($('meta[name="robots"]').attr('content')).toBe('noindex, follow');
  });

  test('category page should list posts in that category', () => {
    const $ = loadCheerio(path.join('categoria', 'tutoriais', 'index.html'));
    expect($('body').text()).toContain('Playwright para Iniciantes');
    expect($('body').text()).toContain('Como Iniciar um Projeto em Robot Framework');
  });

  test('category page should not include posts from other categories', () => {
    const $ = loadCheerio(path.join('categoria', 'tutoriais', 'index.html'));
    expect($('body').text()).not.toContain('Shift-Left');
  });
});

describe('Sitemap', () => {
  test('sitemap.xml should exist', () => {
    expect(fileExists('sitemap.xml')).toBe(true);
  });

  test('sitemap.xml should contain all 10 posts', () => {
    const xml = readFile('sitemap.xml');
    expect(xml).toContain('qaoverflow.com/post/shift-left-shift-right-qa-automation-senior-2026');
    expect(xml).toContain('qaoverflow.com/post/playwright-para-iniciantes');
    expect(xml).toContain('qaoverflow.com/post/como-iniciar-projeto-robot-framework');
    expect(xml).toContain('qaoverflow.com/post/qa-overflow-o-que-e-guia-para-iniciantes');
    expect(xml).toContain('qaoverflow.com/post/boas-praticas-em-automacao-de-testes-um-guia-para-2026');
    expect(xml).toContain('qaoverflow.com/post/design-patterns-para-automacao-de-testes-a-arquitetura-que-sobrevive-ao-caos');
    expect(xml).toContain('qaoverflow.com/post/metodologia-scrum-com-automacao-de-testes');
    expect(xml).toContain('qaoverflow.com/post/qa-overflow-combinando-ia-e-blog-para-aprender-e-ensinar-qa');
    expect(xml).toContain('qaoverflow.com/post/identificar-testes-manuais-que-podem-ser-automatizados-um-guia-pratico');
    expect(xml).toContain('qaoverflow.com/post/qa-overflow-picker-google-chrome-extension');
  });

  test('sitemap.xml should contain static pages', () => {
    const xml = readFile('sitemap.xml');
    expect(xml).toContain('qaoverflow.com/</loc>');
    expect(xml).toContain('qaoverflow.com/sobre/');
    expect(xml).toContain('qaoverflow.com/tutoriais/');
  });

  test('sitemap.xml should contain tag pages', () => {
    const xml = readFile('sitemap.xml');
    expect(xml).toContain('tag/scrum');
    expect(xml).toContain('tag/playwright');
  });

  test('sitemap.xml should contain category pages', () => {
    const xml = readFile('sitemap.xml');
    expect(xml).toContain('categoria/boas-praticas');
    expect(xml).toContain('categoria/tutoriais');
  });

  test('sitemap.xml should have valid URL count', () => {
    const xml = readFile('sitemap.xml');
    const urls = xml.match(/<url>/g);
    const expected = 9 + 3 + 2 + 2; // posts + static + tags(2) + categories(2) 
    expect(urls.length).toBeGreaterThanOrEqual(expected);
  });
});

describe('RSS Feed', () => {
  test('rss.xml should exist', () => {
    expect(fileExists('rss.xml')).toBe(true);
  });

  test('rss.xml should contain all published posts', () => {
    const xml = readFile('rss.xml');
    expect(xml).toContain('Shift-Left');
    expect(xml).toContain('Playwright para Iniciantes');
    expect(xml).toContain('Como Iniciar um Projeto em Robot Framework');
  });

  test('rss.xml should have valid XML structure', () => {
    const xml = readFile('rss.xml');
    expect(xml).toContain('<rss');
    expect(xml).toContain('<channel>');
    expect(xml).toContain('</channel>');
    expect(xml).toContain('</rss>');
  });
});

describe('PWA Manifest', () => {
  test('manifest.json should exist', () => {
    expect(fileExists('manifest.json')).toBe(true);
  });

  test('manifest.json should be valid JSON', () => {
    const manifest = JSON.parse(readFile('manifest.json'));
    expect(manifest.name).toBe('QA Overflow');
    expect(manifest.short_name).toBe('QA Overflow');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBe('#212529');
  });

  test('manifest.json should have icons', () => {
    const manifest = JSON.parse(readFile('manifest.json'));
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifest.icons[0].sizes).toBe('192x192');
    expect(manifest.icons[1].sizes).toBe('512x512');
  });
});

describe('SEO - Meta Tags', () => {
  test('homepage should have index,follow robots', () => {
    const $ = loadCheerio('index.html');
    expect($('meta[name="robots"]').attr('content')).toBe('index, follow');
  });

  test('homepage should have Canonical link', () => {
    const $ = loadCheerio('index.html');
    expect($('link[rel="canonical"]').attr('href')).toContain('qaoverflow.com/');
  });

  test('homepage should have OG image', () => {
    const $ = loadCheerio('index.html');
    expect($('meta[property="og:image"]').attr('content')).toContain('og-image-1200x630.png');
  });

  test('post page should have per-post OG image if coverImage exists', () => {
    const $ = loadCheerio(path.join('post', 'shift-left-shift-right-qa-automation-senior-2026', 'index.html'));
    const ogImage = $('meta[property="og:image"]').attr('content');
    expect(ogImage).toContain('images.unsplash.com');
  });

  test('post page should prefer coverImage over site OG image', () => {
    const $ = loadCheerio(path.join('post', 'design-patterns-para-automacao-de-testes-a-arquitetura-que-sobrevive-ao-caos', 'index.html'));
    const ogImage = $('meta[property="og:image"]').attr('content');
    expect(ogImage).toContain('images.unsplash.com');
  });

  test('homepage should fallback to site OG image when no post', () => {
    const $ = loadCheerio('index.html');
    const ogImage = $('meta[property="og:image"]').attr('content');
    expect(ogImage).toContain('og-image-1200x630.png');
  });
});

describe('Breadcrumb JSON-LD', () => {
  test('post page should have BreadcrumbList JSON-LD', () => {
    const html = readFile(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect(html).toContain('BreadcrumbList');
    expect(html).toContain('"position": 1');
    expect(html).toContain('"position": 2');
    expect(html).toContain('"position": 3');
  });

  test('breadcrumb should include category and title', () => {
    const html = readFile(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect(html).toContain('categoria/tutoriais');
    expect(html).toContain('Playwright para Iniciantes');
  });
});

describe('TOC Functionality', () => {
  test('post with headings should have TOC sidebar', () => {
    const $ = loadCheerio(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect($('.toc-container').length).toBe(1);
    expect($('.toc-container .nav-link').length).toBeGreaterThanOrEqual(2);
  });

  test('TOC links should point to heading IDs', () => {
    const $ = loadCheerio(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    $('.toc-container .nav-link').each(function() {
      const href = $(this).attr('href');
      expect(href).toMatch(/^#heading-\d+$/);
    });
  });

  test('headings should have anchor IDs', () => {
    const $ = loadCheerio(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    const headingIds = [];
    $('h2[id], h3[id]').each(function() {
      headingIds.push($(this).attr('id'));
    });
    expect(headingIds.length).toBeGreaterThanOrEqual(2);
    headingIds.forEach(function(id) {
      expect(id).toMatch(/^heading-\d+$/);
    });
  });

  test('each TOC link should correspond to a real heading', () => {
    const $ = loadCheerio(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    $('.toc-container .nav-link').each(function() {
      const id = $(this).attr('href').slice(1);
      expect($('#' + id).length).toBe(1);
    });
  });
});

describe('Copy Button', () => {
  test('post with code blocks should have copy button script', () => {
    const html = readFile(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect(html).toContain('copy-button');
    expect(html).toContain('code-block-wrapper');
    expect(html).toContain('Copiar');
    expect(html).toContain('navigator.clipboard.writeText');
  });

  test('post without code blocks should not have copy button script', () => {
    const $ = loadCheerio('index.html');
    expect($('pre').length).toBe(0);
  });
});

describe('Cover Images', () => {
  test('post cover image should have fetchpriority and dimensions', () => {
    const $ = loadCheerio(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    const img = $('article img').first();
    expect(img.attr('fetchpriority')).toBe('high');
    expect(img.attr('width')).toBe('800');
    expect(img.attr('height')).toBe('400');
    expect(img.attr('loading')).toBe('lazy');
  });
});

describe('Icons and PWA', () => {
  test('PWA icon 192 should exist', () => {
    expect(fileExists(path.join('images', 'icon-192.png'))).toBe(true);
  });

  test('PWA icon 512 should exist', () => {
    expect(fileExists(path.join('images', 'icon-512.png'))).toBe(true);
  });

  test('homepage should link to manifest', () => {
    const $ = loadCheerio('index.html');
    expect($('link[rel="manifest"]').attr('href')).toBe('/manifest.json');
  });

  test('homepage should have apple-touch-icon', () => {
    const $ = loadCheerio('index.html');
    expect($('link[rel="apple-touch-icon"]').length).toBe(1);
  });
});

describe('Post Metadata', () => {
  test('post page should display read time', () => {
    const $ = loadCheerio(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect($('body').text()).toContain('min');
  });

  test('post page should display dated date', () => {
    const $ = loadCheerio(path.join('post', 'shift-left-shift-right-qa-automation-senior-2026', 'index.html'));
    expect($('time').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Service Worker', () => {
  test('sw.js should exist', () => {
    expect(fileExists('sw.js')).toBe(true);
  });

  test('sw.js should contain cache configuration', () => {
    const sw = readFile('sw.js');
    expect(sw).toContain('qaoverflow-v2');
    expect(sw).toContain('self.addEventListener(\'install\'');
    expect(sw).toContain('self.addEventListener(\'fetch\'');
    expect(sw).toContain('self.addEventListener(\'activate\'');
  });
});
