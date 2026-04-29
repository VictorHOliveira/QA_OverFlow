const fs = require('fs');
const path = require('path');

const blogPath = path.join(__dirname, '..', 'data', 'blog.json');

describe('Blog Data (blog.json) Regression Tests', () => {
  
  let blogData;
  
  beforeAll(() => {
    const raw = fs.readFileSync(blogPath, 'utf-8');
    blogData = JSON.parse(raw);
  });

  test('31. blog.json should exist and be valid JSON', () => {
    expect(blogData).toBeTruthy();
    expect(blogData.posts).toBeTruthy();
  });

  test('32. blog.json should have posts array', () => {
    expect(Array.isArray(blogData.posts)).toBe(true);
  });

  test('33. blog.json should have exactly 4 posts', () => {
    expect(blogData.posts.length).toBe(4);
  });

  test('34. Scrum post should be in blog.json', () => {
    const scrumPost = blogData.posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    expect(scrumPost).toBeTruthy();
    expect(scrumPost.title).toContain('Metodologia Scrum');
  });

  test('35. Scrum post should have required fields', () => {
    const scrumPost = blogData.posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    expect(scrumPost.title).toBeTruthy();
    expect(scrumPost.dated).toBeTruthy();
    expect(scrumPost.author).toBeTruthy();
    expect(scrumPost.category).toBeTruthy();
    expect(scrumPost.tags).toBeTruthy();
    expect(scrumPost.body).toBeTruthy();
  });

  test('36. Scrum post should have valid date format', () => {
    const scrumPost = blogData.posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    const date = new Date(scrumPost.dated);
    expect(date.toString()).not.toBe('Invalid Date');
  });

  test('37. Scrum post should have tags array', () => {
    const scrumPost = blogData.posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    expect(Array.isArray(scrumPost.tags)).toBe(true);
    expect(scrumPost.tags.length).toBeGreaterThan(0);
  });

  test('38. Scrum post tags should include "scrum"', () => {
    const scrumPost = blogData.posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    const tagsLower = scrumPost.tags.map(t => t.toLowerCase());
    expect(tagsLower).toEqual(expect.arrayContaining([expect.stringContaining('scrum')]));
  });

  test('39. All posts should have valid slug', () => {
    blogData.posts.forEach(post => {
      expect(post.slug).toBeTruthy();
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  test('40. All posts should have author Victor Oliveira', () => {
    blogData.posts.forEach(post => {
      expect(post.author).toBe('Victor Oliveira');
    });
  });

  test('41. blog.json should have latestPosts array', () => {
    expect(blogData.latestPosts).toBeTruthy();
    expect(Array.isArray(blogData.latestPosts)).toBe(true);
  });

  test('42. latestPosts should contain Scrum post', () => {
    const scrumInLatest = blogData.latestPosts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    expect(scrumInLatest).toBeTruthy();
  });

  test('43. All posts should have non-empty body', () => {
    blogData.posts.forEach(post => {
      expect(post.body.length).toBeGreaterThan(100);
    });
  });

  test('44. All posts should have category', () => {
    blogData.posts.forEach(post => {
      expect(post.category).toBeTruthy();
    });
  });

  test('45. Scrum post category should be Boas Práticas', () => {
    const scrumPost = blogData.posts.find(p => p.slug === 'metodologia-scrum-com-automacao-de-testes');
    expect(scrumPost.category.toLowerCase()).toContain('boas-práticas');
  });

});
