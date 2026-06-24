const fs = require('fs');
const path = require('path');

const postsPath = path.join(__dirname, '..', 'src', '_data', 'posts.json');

describe('Blog Data (src/_data/posts.json) Regression Tests', () => {

  let posts;

  beforeAll(() => {
    const raw = fs.readFileSync(postsPath, 'utf-8');
    posts = JSON.parse(raw);
  });

  test('31. posts.json should exist and be valid JSON', () => {
    expect(posts).toBeTruthy();
    expect(Array.isArray(posts)).toBe(true);
  });

  test('32. posts.json should have at least 4 posts', () => {
    expect(posts.length).toBeGreaterThanOrEqual(4);
  });

    test('33. posts.json should have at least 11 posts', () => {
        expect(posts.length).toBeGreaterThanOrEqual(11);
  });

  test('34. Scrum post should be in posts.json', () => {
    const scrumPost = posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    expect(scrumPost).toBeTruthy();
    expect(scrumPost.title).toContain('Metodologia Scrum');
  });

  test('35. Scrum post should have required fields', () => {
    const scrumPost = posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    expect(scrumPost.title).toBeTruthy();
    expect(scrumPost.datePublished).toBeTruthy();
    expect(scrumPost.author).toBeTruthy();
    expect(scrumPost.category).toBeTruthy();
    expect(scrumPost.tags).toBeTruthy();
    expect(scrumPost.content).toBeTruthy();
  });

  test('36. Scrum post should have valid datePublished', () => {
    const scrumPost = posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    const date = new Date(scrumPost.datePublished);
    expect(date.toString()).not.toBe('Invalid Date');
  });

  test('37. Scrum post should have tags array', () => {
    const scrumPost = posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    expect(Array.isArray(scrumPost.tags)).toBe(true);
    expect(scrumPost.tags.length).toBeGreaterThan(0);
  });

  test('38. Scrum post tags should include "scrum"', () => {
    const scrumPost = posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    const tagsLower = scrumPost.tags.map(t => t.toLowerCase());
    expect(tagsLower).toEqual(expect.arrayContaining([expect.stringContaining('scrum')]));
  });

  test('39. All posts should have valid slug', () => {
    posts.forEach(post => {
      expect(post.slug).toBeTruthy();
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  test('40. All posts should have author Victor Oliveira', () => {
    posts.forEach(post => {
      expect(post.author).toBe('Victor Oliveira');
    });
  });

  test('41. Every post should have status "published"', () => {
    posts.forEach(post => {
      expect(post.status).toBe('published');
    });
  });

  test('42. All posts should have non-empty content', () => {
    posts.forEach(post => {
      expect(post.content.length).toBeGreaterThan(100);
    });
  });

  test('43. All posts should have category', () => {
    posts.forEach(post => {
      expect(post.category).toBeTruthy();
    });
  });

  test('44. All posts should have datePublished', () => {
    posts.forEach(post => {
      expect(post.datePublished).toBeTruthy();
      const d = new Date(post.datePublished);
      expect(d.toString()).not.toBe('Invalid Date');
    });
  });

  test('45. Scrum post category should be boas-praticas', () => {
    const scrumPost = posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    expect(scrumPost.category).toBe('boas-praticas');
  });

});
