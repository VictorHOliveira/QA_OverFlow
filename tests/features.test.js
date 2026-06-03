const fs = require('fs');
const path = require('path');

const SITE_DIR = path.join(__dirname, '..', '_site');
const BASE_URL = 'https://qaoverflow.com';

function readFile(filePath) {
  return fs.readFileSync(path.join(SITE_DIR, filePath), 'utf-8');
}

function fileExists(filePath) {
  return fs.existsSync(path.join(SITE_DIR, filePath));
}

describe('404 Page', () => {
  test('404.html should exist', () => {
    expect(fileExists('404.html')).toBe(true);
  });

  test('404.html should have correct title', () => {
    const html = readFile('404.html');
    expect(html).toContain('Página não encontrada');
  });

  test('404.html should have link to homepage', () => {
    const html = readFile('404.html');
    expect(html).toContain('Voltar ao Início');
    expect(html).toContain('href="/"');
  });
});

describe('Tag Pages', () => {
  const tags = ['2026', 'qa', 'automacao', 'playwright', 'robot-framework', 'scrum', 'boas-praticas'];

  tags.forEach(tag => {
    test(`/tag/${tag}/ should exist and contain the tag name`, () => {
      const html = readFile(path.join('tag', tag, 'index.html'));
      expect(html).toContain(tag);
    });
  });

  test('tag page should list posts with that tag', () => {
    const html = readFile(path.join('tag', 'scrum', 'index.html'));
    expect(html).toContain('Metodologia Scrum com Automação de Testes');
  });

  test('tag page should have back to home link', () => {
    const html = readFile(path.join('tag', 'qa', 'index.html'));
    expect(html).toContain('Página Inicial');
    expect(html).toContain('href="/"');
  });
});

describe('Category Pages', () => {
  test('/categoria/boas-praticas/ should exist', () => {
    const html = readFile(path.join('categoria', 'boas-praticas', 'index.html'));
    expect(html).toContain('boas-praticas');
  });

  test('/categoria/tutoriais/ should exist', () => {
    const html = readFile(path.join('categoria', 'tutoriais', 'index.html'));
    expect(html).toContain('tutoriais');
  });

  test('category page should list posts in that category', () => {
    const html = readFile(path.join('categoria', 'tutoriais', 'index.html'));
    expect(html).toContain('Playwright para Iniciantes');
    expect(html).toContain('Como Iniciar um Projeto em Robot Framework');
  });

  test('category page should not include posts from other categories', () => {
    const html = readFile(path.join('categoria', 'tutoriais', 'index.html'));
    expect(html).not.toContain('Shift-Left');
  });
});

describe('Sitemap', () => {
  test('sitemap.xml should exist', () => {
    expect(fileExists('sitemap.xml')).toBe(true);
  });

  test('sitemap.xml should contain all posts', () => {
    const xml = readFile('sitemap.xml');
    expect(xml).toContain('qaoverflow.com/post/shift-left-shift-right-qa-automation-senior-2026');
    expect(xml).toContain('qaoverflow.com/post/playwright-para-iniciantes');
    expect(xml).toContain('qaoverflow.com/post/como-iniciar-projeto-robot-framework');
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

  test('sitemap.xml should have valid XML structure', () => {
    const xml = readFile('sitemap.xml');
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset');
    expect(xml).toContain('</urlset>');
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

describe('SEO - Open Graph', () => {
  test('homepage should have og:image', () => {
    const html = readFile('index.html');
    expect(html).toContain('og:image');
    expect(html).toContain('/images/og-image-1200x630.png');
  });

  test('post page should have per-post og:image if coverImage exists', () => {
    const html = readFile(path.join('post', 'shift-left-shift-right-qa-automation-senior-2026', 'index.html'));
    expect(html).toContain('og:image');
    expect(html).toContain('images.unsplash.com');
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

  test('breadcrumb should include category link', () => {
    const html = readFile(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect(html).toContain('categoria/tutoriais');
  });
});

describe('TOC Functionality', () => {
  test('post with headings should have TOC sidebar', () => {
    const html = readFile(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect(html).toContain('toc-container');
    expect(html).toContain('Neste artigo');
  });

  test('TOC links should point to heading IDs', () => {
    const html = readFile(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect(html).toContain('href="#heading-0"');
  });

  test('headings should have anchor IDs', () => {
    const html = readFile(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect(html).toContain('id="heading-');
  });
});

describe('Copy Button', () => {
  test('post with code blocks should have copy buttons', () => {
    const html = readFile(path.join('post', 'playwright-para-iniciantes', 'index.html'));
    expect(html).toContain('code-block-wrapper');
    expect(html).toContain('copy-button');
    expect(html).toContain('Copiar');
  });
});

describe('Icons', () => {
  test('PWA icon 192 should exist', () => {
    expect(fileExists(path.join('images', 'icon-192.png'))).toBe(true);
  });

  test('PWA icon 512 should exist', () => {
    expect(fileExists(path.join('images', 'icon-512.png'))).toBe(true);
  });
});
