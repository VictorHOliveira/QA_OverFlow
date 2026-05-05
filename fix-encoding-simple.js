// Encoding: UTF-8 (suporte a caracteres especiais pt-BR)
// Este script corrige encoding lendo do git history como latin1
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fix mojibake: read from git object as binary (latin1), convert to UTF-8
function fixFile(filePath) {
    try {
        // Read from git object (this has the mojibake)
        const gitContent = execSync(`git show HEAD:"${filePath}"`, { encoding: 'latin1' });
        
        // gitContent is now interpreted as Latin1 (Windows-1252)
        // Convert to Buffer and then to UTF-8
        const buffer = Buffer.from(gitContent, 'latin1');
        const fixed = buffer.toString('utf8');
        
        // Write back as UTF-8 without BOM
        fs.writeFileSync(filePath, fixed, 'utf8');
        return true;
    } catch (e) {
        // File might not be in git HEAD, try reading from disk
        try {
            const diskContent = fs.readFileSync(filePath, 'utf8');
            const buffer = Buffer.from(diskContent, 'latin1');
            const fixed = buffer.toString('utf8');
            if (diskContent !== fixed) {
                fs.writeFileSync(filePath, fixed, 'utf8');
                return true;
            }
        } catch (e2) {
            // Ignore
        }
        return false;
    }
}

// Files to fix
const filesToFix = [
    'index.html',
    '404.html',
    'posts.html',
    'data/blog.json'
];

// Add all posts
const postsDir = 'post';
if (fs.existsSync(postsDir)) {
    fs.readdirSync(postsDir).forEach(post => {
        const postPath = path.join(postsDir, post, 'index.html');
        if (fs.existsSync(postPath)) {
            filesToFix.push(postPath);
        }
    });
}

// Add tags
const tagDir = 'tag';
if (fs.existsSync(tagDir)) {
    fs.readdirSync(tagDir).forEach(tag => {
        const tagPath = path.join(tagDir, tag, 'index.html');
        if (fs.existsSync(tagPath)) {
            filesToFix.push(tagPath);
        }
    });
}

// Add categories
const catDir = 'category';
if (fs.existsSync(catDir)) {
    fs.readdirSync(catDir).forEach(cat => {
        const catPath = path.join(catDir, cat, 'index.html');
        if (fs.existsSync(catPath)) {
            filesToFix.push(catPath);
        }
    });
}

console.log(`Processing ${filesToFix.length} files...`);
let fixedCount = 0;

filesToFix.forEach(file => {
    try {
        if (fixFile(file)) {
            console.log(`✅ Fixed: ${file}`);
            fixedCount++;
        }
    } catch (e) {
        // Ignore
    }
});

console.log(`\n✅ Done! ${fixedCount} files fixed.`);
