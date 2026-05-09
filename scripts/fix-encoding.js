const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '..', 'post');
const postsJsonPath = path.join(__dirname, '..', 'src', '_data', 'posts.json');

const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
const blogJsonPath = path.join(__dirname, '..', 'data', 'blog.json');
const blogJson = JSON.parse(fs.readFileSync(blogJsonPath, 'utf8'));

const blogPostsMap = {};
blogJson.posts.forEach(p => {
    blogPostsMap[p.slug] = p;
});

function readFileRaw(filePath) {
    return fs.readFileSync(filePath);
}

function detectEncoding(buffer) {
    const hasBom = buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
    
    let utf8Invalid = 0;
    let latin1Probable = 0;
    
    for (let i = 0; i < buffer.length; i++) {
        const b = buffer[i];
        
        if (b >= 0xC0 && b <= 0xDF) {
            if (i + 1 < buffer.length && buffer[i + 1] >= 0x80 && buffer[i + 1] <= 0xBF) {
                i++;
                continue;
            }
            utf8Invalid++;
        }
        else if (b >= 0xE0 && b <= 0xEF) {
            if (i + 2 < buffer.length && 
                buffer[i + 1] >= 0x80 && buffer[i + 1] <= 0xBF &&
                buffer[i + 2] >= 0x80 && buffer[i + 2] <= 0xBF) {
                i += 2;
                continue;
            }
            utf8Invalid++;
        }
        else if (b > 0x7F) {
            if (b >= 0x80 && b <= 0x9F) {
                latin1Probable++;
            }
        }
    }
    
    return { hasBom, utf8Invalid, latin1Probable };
}

function tryFixEncoding(str) {
    if (!str || typeof str !== 'string') return str;
    
    const originalBadCount = (str.match(/�/g) || []).length;
    if (originalBadCount === 0) return str;
    
    let bestResult = str;
    let bestBadCount = originalBadCount;
    
    try {
        const latin1Bytes = Buffer.from(str, 'latin1');
        const utf8Attempt = latin1Bytes.toString('utf8');
        const utf8BadCount = (utf8Attempt.match(/�/g) || []).length;
        
        if (utf8BadCount < bestBadCount) {
            bestBadCount = utf8BadCount;
            bestResult = utf8Attempt;
        }
    } catch (e) {}
    
    try {
        const win1252Map = {
            '\x80': '€', '\x82': '‚', '\x83': 'ƒ', '\x84': '„', '\x85': '…',
            '\x86': '†', '\x87': '‡', '\x88': 'ˆ', '\x89': '‰', '\x8A': 'Š',
            '\x8B': '‹', '\x8C': 'Œ', '\x8E': 'Ž', '\x91': '‘', '\x92': '’',
            '\x93': '“', '\x94': '”', '\x95': '•', '\x96': '–', '\x97': '—',
            '\x98': '˜', '\x99': '™', '\x9A': 'š', '\x9B': '›', '\x9C': 'œ',
            '\x9E': 'ž', '\x9F': 'Ÿ'
        };
        
        let win1252Attempt = str.replace(/[\x80-\x9F]/g, (m) => win1252Map[m] || m);
        
        const latin1Bytes2 = Buffer.from(win1252Attempt, 'latin1');
        const utf8FromWin1252 = latin1Bytes2.toString('utf8');
        const win1252BadCount = (utf8FromWin1252.match(/�/g) || []).length;
        
        if (win1252BadCount < bestBadCount) {
            bestBadCount = win1252BadCount;
            bestResult = utf8FromWin1252;
        }
    } catch (e) {}
    
    const ptBrChars = ['á', 'à', 'ã', 'â', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ü', 'ç',
                       'Á', 'À', 'Ã', 'Â', 'É', 'Ê', 'Í', 'Ó', 'Ô', 'Õ', 'Ú', 'Ü', 'Ç'];
    const ptBrCount = ptBrChars.reduce((count, char) => count + (bestResult.match(new RegExp(char, 'g')) || []).length, 0);
    
    return bestResult;
}

function extractContentFromHtml(htmlPath) {
    try {
        const buffer = readFileRaw(htmlPath);
        const encoding = detectEncoding(buffer);
        
        let html;
        try {
            html = buffer.toString('utf8');
        } catch (e) {
            html = buffer.toString('latin1');
        }
        
        const contentMatch = html.match(/<article[\s\S]*?<\/article>/i);
        if (!contentMatch) {
            const mainMatch = html.match(/<div class="main-content"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i);
            if (mainMatch) {
                return tryFixEncoding(mainMatch[0]);
            }
            return '';
        }
        
        let content = contentMatch[0];
        
        content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');
        
        content = content.replace(/<span[^>]*class="[^"]*glyphicon[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
        content = content.replace(/<span[^>]*>Victor Oliveira[\s\S]*?<\/span>/gi, '');
        content = content.replace(/Victor Oliveira[\s\S]*?<span[^>]*class="[^"]*glyphicon[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
        
        content = content.replace(/<hr\s*\/?>/i, '');
        
        content = content.replace(/<div class="post-content">/gi, '');
        content = content.replace(/<p class="post-content">/gi, '<p>');
        content = content.replace(/<\/div>\s*<\/p>/gi, '</p>');
        
        content = content.replace(/&nbsp;/g, ' ');
        content = content.replace(/\s{2,}/g, ' ');
        content = content.trim();
        
        return tryFixEncoding(content);
    } catch (err) {
        console.log(`  Error: ${err.message}`);
        return '';
    }
}

console.log('=== Fixing Encoding ===\n');

const summary = {
    total: 0,
    fromBlogJson: 0,
    fixedFromHtml: 0,
    needsManualReview: 0,
    details: []
};

posts.forEach((post, index) => {
    summary.total++;
    
    const beforeBadCount = post.content ? (post.content.match(/�/g) || []).length : 0;
    
    if (blogPostsMap[post.slug] && blogPostsMap[post.slug].body && blogPostsMap[post.slug].body.length > 100) {
        const blogPost = blogPostsMap[post.slug];
        const blogBadCount = (blogPost.body.match(/�/g) || []).length;
        
        if (blogBadCount === 0) {
            console.log(`[${index + 1}] ${post.slug}`);
            console.log(`  → Using blog.json (perfect encoding)`);
            posts[index].content = blogPost.body;
            if (blogPost.summary) {
                posts[index].summary = blogPost.summary;
            }
            summary.fromBlogJson++;
            summary.details.push({ slug: post.slug, source: 'blog.json', before: beforeBadCount, after: 0 });
            return;
        }
    }
    
    const postDir = path.join(postsDir, post.slug);
    const htmlPath = path.join(postDir, 'index.html');
    
    if (fs.existsSync(htmlPath)) {
        console.log(`[${index + 1}] ${post.slug}`);
        console.log(`  → Extracting from HTML and trying to fix encoding...`);
        
        const newContent = extractContentFromHtml(htmlPath);
        const afterBadCount = newContent ? (newContent.match(/�/g) || []).length : beforeBadCount;
        
        if (afterBadCount < beforeBadCount) {
            console.log(`  ✓ Fixed: ${beforeBadCount} → ${afterBadCount} bad chars`);
            posts[index].content = newContent;
            summary.fixedFromHtml++;
            summary.details.push({ slug: post.slug, source: 'html_fixed', before: beforeBadCount, after: afterBadCount });
        } else if (afterBadCount === 0 && beforeBadCount > 0) {
            console.log(`  ✓ Perfectly fixed!`);
            posts[index].content = newContent;
            summary.fixedFromHtml++;
            summary.details.push({ slug: post.slug, source: 'html_fixed', before: beforeBadCount, after: 0 });
        } else {
            console.log(`  ⚠ No improvement (${afterBadCount} bad chars)`);
            summary.needsManualReview++;
            summary.details.push({ slug: post.slug, source: 'needs_review', before: beforeBadCount, after: afterBadCount });
        }
    } else {
        console.log(`[${index + 1}] ${post.slug}`);
        console.log(`  ⚠ HTML file not found`);
        summary.needsManualReview++;
        summary.details.push({ slug: post.slug, source: 'not_found', before: beforeBadCount, after: beforeBadCount });
    }
});

fs.writeFileSync(postsJsonPath, JSON.stringify(posts, null, 2), 'utf8');

console.log('\n=== Summary ===');
console.log(`Total posts: ${summary.total}`);
console.log(`  From blog.json (perfect): ${summary.fromBlogJson}`);
console.log(`  Fixed from HTML: ${summary.fixedFromHtml}`);
console.log(`  Needs manual review: ${summary.needsManualReview}`);

if (summary.needsManualReview > 0) {
    console.log('\n=== Posts for Manual Review ===');
    summary.details
        .filter(d => d.source === 'needs_review' || d.source === 'not_found')
        .forEach(d => {
            console.log(`  - ${d.slug}: ${d.before} → ${d.after} bad chars`);
        });
}

console.log('\nDone! posts.json updated.');
