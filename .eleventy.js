const CleanCSS = require("clean-css");

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
  eleventyConfig.addPassthroughCopy("google911169691ccf5c0a.html");

  eleventyConfig.addDataExtension("json", (contents) => JSON.parse(contents));

  const posts = require('./src/_data/posts.js');

  function isPublished(post) {
    if (!post || post.status !== "published") return false;
    if (!post.datePublished) return true;
    var postDate;
    if (post.datePublished.indexOf("T") !== -1) {
      postDate = new Date(post.datePublished);
    } else {
      postDate = new Date(post.datePublished + "T23:59:59");
    }
    return postDate <= new Date();
  }

  eleventyConfig.addFilter("isPublished", isPublished);

  eleventyConfig.addFilter("published", function(array) {
    if (!Array.isArray(array)) return [];
    return array.filter(isPublished);
  });

  eleventyConfig.addCollection("allTags", function() {
    const tags = new Set();
    posts.filter(isPublished).forEach(p => {
      (p.tags || []).forEach(t => tags.add(t));
    });
    return [...tags].sort();
  });

  eleventyConfig.addCollection("allCategories", function() {
    const cats = new Set();
    posts.filter(isPublished).forEach(p => {
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
      .filter(p => p.slug !== currentPost.slug && isPublished(p))
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
    var truncated = str.substring(0, length);
    var lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > length * 0.7) {
      truncated = truncated.substring(0, lastSpace);
    }
    return truncated.trim() + (suffix || "");
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

  eleventyConfig.on('eleventy.after', function() {
    var path = require('path');
    var fs = require('fs');
    var outputDir = '_site';
    function minifyCSS(dir) {
      fs.readdirSync(dir).forEach(function(entry) {
        var full = path.join(dir, entry);
        if (fs.statSync(full).isDirectory()) {
          minifyCSS(full);
        } else if (entry.endsWith('.css') && !entry.endsWith('.min.css')) {
          var src = fs.readFileSync(full, 'utf-8');
          var min = new CleanCSS({ level: 2 }).minify(src);
          if (!min.errors.length) {
            fs.writeFileSync(full, min.styles, 'utf-8');
          }
        }
      });
    }
    minifyCSS(outputDir);
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
