const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const postsDir = path.join(__dirname, '..', 'post');
const postsJsonPath = path.join(__dirname, '..', 'src', '_data', 'posts.json');
const blogJsonPath = path.join(__dirname, '..', 'data', 'blog.json');

const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
const blogJson = JSON.parse(fs.readFileSync(blogJsonPath, 'utf8'));

const blogPostsMap = {};
blogJson.posts.forEach(p => {
    blogPostsMap[p.slug] = p;
});

function cleanHtmlContent(content) {
    if (!content) return content;
    
    let cleaned = content;
    
    cleaned = cleaned.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
    
    cleaned = cleaned.replace(/<span[^>]*class="[^"]*glyphicon[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
    
    cleaned = cleaned.replace(/Victor Oliveira[\s\S]*?(?=<p>|<h[2-6]|<ul>|<ol>|<table>|<pre>|<blockquote>)/gi, '');
    cleaned = cleaned.replace(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s*(?:AM|PM)?/gi, '');
    
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*post-info[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*tag_cloud[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    
    cleaned = cleaned.replace(/<a[^>]*href="[^"]*\/tag\/[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
    cleaned = cleaned.replace(/<a[^>]*href="[^"]*\/category\/[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
    
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>/gi, '');
    cleaned = cleaned.replace(/<p[^>]*class="[^"]*post-content[^"]*"[^>]*>/gi, '<p>');
    
    cleaned = cleaned.replace(/<hr\s*\/?>/gi, '');
    
    cleaned = cleaned.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '');
    cleaned = cleaned.replace(/<br\s*\/?>$/gi, '');
    
    cleaned = cleaned.replace(/&nbsp;/gi, ' ');
    cleaned = cleaned.replace(/\s{2,}/gi, ' ');
    cleaned = cleaned.replace(/\n\s*\n\s*\n/gi, '\n\n');
    
    cleaned = cleaned.replace(/^[\s\n]+|[\s\n]+$/g, '');
    
    return cleaned;
}

function extractAndCleanContent(htmlPath) {
    try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        
        const article = doc.querySelector('article');
        
        if (!article) {
            console.log(`  Warning: No article found`);
            return '';
        }
        
        const unwantedSelectors = [
            'span.glyphicon',
            'a.tag_cloud',
            '.post-info',
            '.tag_cloud',
            'nav',
            '.toast-notification',
            '.searchButton',
            '.navbar',
            'a[href*="/tag/"]',
            'a[href*="/category/"]'
        ];
        
        unwantedSelectors.forEach(selector => {
            const elements = article.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });
        
        let content = article.innerHTML;
        
        content = cleanHtmlContent(content);
        
        return content;
    } catch (err) {
        console.log(`  Error: ${err.message}`);
        return '';
    }
}

console.log('=== Cleaning Post Content (v2) ===\n');

const summary = {
    total: 0,
    fromBlogJson: 0,
    extractedAndCleaned: 0,
    details: []
};

posts.forEach((post, index) => {
    summary.total++;
    
    if (blogPostsMap[post.slug] && blogPostsMap[post.slug].body && blogPostsMap[post.slug].body.length > 100) {
        const blogPost = blogPostsMap[post.slug];
        console.log(`[${index + 1}] ${post.slug}`);
        console.log(`  → Using blog.json (perfect content)`);
        posts[index].content = blogPost.body;
        if (blogPost.summary) {
            posts[index].summary = blogPost.summary;
        }
        summary.fromBlogJson++;
        summary.details.push({ slug: post.slug, source: 'blog.json' });
        return;
    }
    
    const postDir = path.join(postsDir, post.slug);
    const htmlPath = path.join(postDir, 'index.html');
    
    if (fs.existsSync(htmlPath)) {
        console.log(`[${index + 1}] ${post.slug}`);
        console.log(`  → Extracting and cleaning from HTML...`);
        
        const cleanedContent = extractAndCleanContent(htmlPath);
        
        if (cleanedContent && cleanedContent.length > 100) {
            posts[index].content = cleanedContent;
            console.log(`  ✓ Cleaned content: ${cleanedContent.length} chars`);
            summary.extractedAndCleaned++;
            summary.details.push({ slug: post.slug, source: 'html_cleaned', length: cleanedContent.length });
        } else {
            console.log(`  ⚠ Content too short or empty`);
            summary.details.push({ slug: post.slug, source: 'failed' });
        }
    } else {
        console.log(`[${index + 1}] ${post.slug}`);
        console.log(`  ⚠ HTML file not found`);
        summary.details.push({ slug: post.slug, source: 'not_found' });
    }
});

fs.writeFileSync(postsJsonPath, JSON.stringify(posts, null, 2), 'utf8');

console.log('\n=== Summary ===');
console.log(`Total posts: ${summary.total}`);
console.log(`  From blog.json: ${summary.fromBlogJson}`);
console.log(`  Extracted and cleaned from HTML: ${summary.extractedAndCleaned}`);

console.log('\nDone! posts.json updated.');
