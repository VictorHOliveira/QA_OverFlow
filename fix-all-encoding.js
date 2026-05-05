const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 修复mojibake的核心函数：UTF-8 bytes → 解读为Windows-1252 → 重新编码为UTF-8
function fixMojibake(text) {
    if (!text.includes('Ã')) return text;
    try {
        const buffer = Buffer.from(text, 'binary'); // 以latin1(即Windows-1252)读取
        return buffer.toString('utf8'); // 重新解读为UTF-8
    } catch (e) {
        return text;
    }
}

// 处理单个文件
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fixed = fixMojibake(content);
        if (content !== fixed) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            return true; // 已修复
        }
        return false; // 无需修复
    } catch (e) {
        console.error(`错误 ${filePath}:`, e.message);
        return false;
    }
}

// 需要处理的文件列表
const filesToProcess = [
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
            filesToProcess.push(postPath);
        }
    });
}

// 添加tags和categories
['tag', 'category'].forEach(dir => {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(subdir => {
            const filePath = path.join(dir, subdir, 'index.html');
            if (fs.existsSync(filePath)) {
                filesToProcess.push(filePath);
            }
        });
    }
});

console.log('处理', filesToProcess.length, '个文件...');
let corrected = 0;

filesToProcess.forEach(file => {
    if (processFile(file)) {
        console.log('✓ 已修复:', file);
        corrected++;
    }
});

console.log(`\n完成! ${corrected} 个文件已修复.`);
