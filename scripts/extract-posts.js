const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const iconv = require('iconv-lite');

const postsDir = path.join(__dirname, '..', 'post');
const postsJsonPath = path.join(__dirname, '..', 'src', '_data', 'posts.json');
const blogJsonPath = path.join(__dirname, '..', 'data', 'blog.json');

const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
const blogJson = JSON.parse(fs.readFileSync(blogJsonPath, 'utf8'));

const blogPostsMap = {};
blogJson.posts.forEach(p => {
    blogPostsMap[p.slug] = p;
});

function readFileWithEncoding(filePath) {
    const buffer = fs.readFileSync(filePath);
    
    try {
        const content = iconv.decode(buffer, 'win1252');
        return content;
    } catch (e) {
        return buffer.toString('utf8');
    }
}

function extractContent(htmlPath) {
    try {
        const html = readFileWithEncoding(htmlPath);
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        
        const mainContent = doc.querySelector('.main-content article');
        
        if (!mainContent) {
            console.log(`  Warning: No article found in ${htmlPath}`);
            return '';
        }
        
        const metadataElements = mainContent.querySelectorAll('span.glyphicon');
        metadataElements.forEach(el => {
            const parent = el.parentElement;
            if (parent && (parent.textContent.includes('Victor Oliveira') || parent.textContent.includes(':'))) {
                const nextSibling = parent.nextSibling;
                if (nextSibling && nextSibling.nodeType === 3 && nextSibling.textContent.trim() === '') {
                    nextSibling.remove();
                }
                parent.remove();
            }
        });
        
        const emptyElements = mainContent.querySelectorAll('p:empty');
        emptyElements.forEach(el => el.remove());
        
        const firstHr = mainContent.querySelector('hr');
        if (firstHr) firstHr.remove();
        
        const postContentDivs = mainContent.querySelectorAll('div.post-content, p.post-content');
        postContentDivs.forEach(div => {
            const parent = div.parentNode;
            while (div.firstChild) {
                parent.insertBefore(div.firstChild, div);
            }
            div.remove();
        });
        
        let content = mainContent.innerHTML.trim();
        
        content = content.replace(/&nbsp;/g, ' ');
        content = content.replace(/\s{2,}/g, ' ');
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return content;
    } catch (err) {
        console.log(`  Error reading ${htmlPath}: ${err.message}`);
        return '';
    }
}

console.log('Updating posts.json with proper content...\n');

posts.forEach((post, index) => {
    if (blogPostsMap[post.slug] && blogPostsMap[post.slug].body && blogPostsMap[post.slug].body.length > 100) {
        const blogPost = blogPostsMap[post.slug];
        console.log(`Using blog.json content for: ${post.slug}`);
        posts[index].content = blogPost.body;
        if (blogPost.summary) {
            posts[index].summary = blogPost.summary;
        }
    } else {
        const postDir = path.join(postsDir, post.slug);
        const htmlPath = path.join(postDir, 'index.html');
        
        if (fs.existsSync(htmlPath)) {
            console.log(`Extracting from HTML: ${post.slug}`);
            const content = extractContent(htmlPath);
            if (content) {
                posts[index].content = content;
                console.log(`  Content extracted: ${content.length} chars`);
            }
        } else {
            console.log(`  Not found: ${htmlPath}`);
        }
    }
});

fs.writeFileSync(postsJsonPath, JSON.stringify(posts, null, 2), 'utf8');
console.log('\nDone! posts.json updated.');
