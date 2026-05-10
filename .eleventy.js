module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("ads.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");
  eleventyConfig.addPassthroughCopy(".nojekyll");

  eleventyConfig.addDataExtension("json", (contents) => JSON.parse(contents));

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
