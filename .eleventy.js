module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("ads.txt");
  eleventyConfig.addPassthroughCopy(".nojekyll");
  eleventyConfig.addPassthroughCopy("manifest.json");
  eleventyConfig.addPassthroughCopy("sw.js");

  eleventyConfig.addDataExtension("json", (contents) => JSON.parse(contents));

  const posts = require('./src/_data/posts.json');

  eleventyConfig.addCollection("allTags", function() {
    const tags = new Set();
    posts.filter(p => p.status === 'published').forEach(p => {
      (p.tags || []).forEach(t => tags.add(t));
    });
    return [...tags].sort();
  });

  eleventyConfig.addCollection("allCategories", function() {
    const cats = new Set();
    posts.filter(p => p.status === 'published').forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return [...cats].sort();
  });

  eleventyConfig.addGlobalData("currentYear", new Date().getFullYear());

  eleventyConfig.addFilter("filter", function(array, prop, value) {
    if (!Array.isArray(array)) return [];
    if (value === undefined) {
      return array.filter(item => item[prop]);
    }
    return array.filter(item => {
      const itemValue = item[prop];
      if (Array.isArray(itemValue)) {
        return itemValue.includes(value);
      }
      return itemValue === value;
    });
  });

  eleventyConfig.addFilter("map", function(array, prop) {
    if (!Array.isArray(array)) return [];
    return array.map(item => item[prop]);
  });

  eleventyConfig.addFilter("unique", function(array) {
    if (!Array.isArray(array)) return [];
    return [...new Set(array)];
  });

  eleventyConfig.addFilter("sortBy", function(array, prop, descending) {
    if (!Array.isArray(array)) return [];
    const sorted = [...array].sort((a, b) => {
      if (!prop) return a > b ? 1 : -1;
      const aVal = a[prop];
      const bVal = b[prop];
      return aVal > bVal ? 1 : -1;
    });
    return descending ? sorted.reverse() : sorted;
  });

  eleventyConfig.addFilter("reverse", function(array) {
    if (!Array.isArray(array)) return array;
    return [...array].reverse();
  });

  eleventyConfig.addFilter("head", function(array, n) {
    if (!Array.isArray(array)) return [];
    return array.slice(0, n || 1);
  });

  eleventyConfig.addFilter("toc", function(html) {
    if (!html) return [];
    const toc = [];
    let index = 0;
    html.replace(/<h([23])[^>]*>(.*?)<\/h[23]>/gi, (match, level, text) => {
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      toc.push({ id: "heading-" + index, text: cleanText, level: parseInt(level) });
      index++;
    });
    return toc;
  });

  eleventyConfig.addFilter("addAnchors", function(html) {
    if (!html) return "";
    let index = 0;
    return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (match, level, attrs, text) => {
      const id = "heading-" + index;
      index++;
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });
  });

  eleventyConfig.addFilter("relatedPosts", function(currentPost, allPosts, limit = 3) {
    if (!currentPost || !Array.isArray(allPosts)) return [];
    const currentTags = currentPost.tags || [];
    return allPosts
      .filter(p => p.slug !== currentPost.slug && p.status === "published")
      .map(p => ({
        ...p,
        sharedCount: (p.tags || []).filter(t => currentTags.includes(t)).length
      }))
      .filter(p => p.sharedCount > 0)
      .sort((a, b) => b.sharedCount - a.sharedCount)
      .slice(0, limit);
  });

  eleventyConfig.addFilter("findIndex", function(array, prop, value) {
    if (!Array.isArray(array)) return -1;
    return array.findIndex(item => item[prop] === value);
  });

  eleventyConfig.addFilter("striptags", function(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  });

  eleventyConfig.addFilter("truncate", function(str, length, suffix) {
    if (!str) return "";
    str = str.toString();
    if (str.length <= length) return str;
    return str.substring(0, length).trim() + (suffix || "");
  });

  eleventyConfig.addFilter("urlEncode", function(str) {
    if (!str) return "";
    return encodeURIComponent(str);
  });

  eleventyConfig.addFilter("slugify", function(str) {
    if (!str) return "";
    return str.toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      data: "_data",
      includes: "_includes"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"]
  };
};
