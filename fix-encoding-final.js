const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 核心修复函数：从git对象读取并修复mojibake
function fixFileFromGit(filePath) {
    try {
        // 从git对象读取（这是带mojibake的版本）
        const gitContent = execSync(`git show HEAD:"${filePath}"`, { encoding: 'binary' });
        
        // gitContent现在是binary（latin1/Windows-1252视角下的mojibake）
        // 我们需要把它从latin1转为Buffer，然后再用UTF-8解读
        const buffer = Buffer.from(gitContent, 'binary');
        const fixed = buffer.toString('utf8');
        
        // 检查是否真的修复了
        if (fixed.includes('Ã') || fixed.includes('Â')) {
            // 可能还需要一次转换
            const doubleFixed = Buffer.from(fixed, 'binary').toString('utf8');
            fs.writeFileSync(filePath, doubleFixed, 'utf8');
            console.log(`✅ Fixed (double): ${filePath}`);
            return true;
        } else {
            fs.writeFileSync(filePath, fixed, 'utf8');
            console.log(`✅ Fixed: ${filePath}`);
            return true;
        }
    } catch (e) {
        console.error(`❌ Error with ${filePath}:`, e.message);
        return false;
    }
}

// 需要处理的文件列表
const filesToFix = [
    'index.html',
    '404.html',
    'posts.html',
    'data/blog.json'
];

// 添加所有posts
const postsDir = 'post';
if (fs.existsSync(postsDir)) {
    fs.readdirSync(postsDir).forEach(post => {
        const postPath = path.join(postsDir, post, 'index.html');
        if (fs.existsSync(postPath)) {
            filesToFix.push(postPath);
        }
    });
}

// 添加tags
const tagDir = 'tag';
if (fs.existsSync(tagDir)) {
    fs.readdirSync(tagDir).forEach(tag => {
        const tagPath = path.join(tagDir, tag, 'index.html');
        if (fs.existsSync(tagPath)) {
            filesToFix.push(tagPath);
        }
    });
}

// 添加categories
const catDir = 'category';
if (fs.existsSync(catDir)) {
    fs.readdirSync(catDir).forEach(cat => {
        const catPath = path.join(catDir, cat, 'index.html');
        if (fs.existsSync(catPath)) {
            filesToFix.push(catPath);
        }
    });
}

console.log(`Processing ${filesToFix.length} files from git objects...\n`);
let fixedCount = 0;

filesToFix.forEach(file => {
    if (fixFileFromGit(file)) {
        fixedCount++;
    }
});

console.log(`\n✅ Done! ${fixedCount} files fixed.`);
