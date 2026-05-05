const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função para corrigir mojibake: ler do git como latin1, converter para UTF-8
function fixFromGit(filePath) {
    try {
        // Lê do objeto git (que tem mojibake)
        const gitContent = execSync(`git show HEAD:"${filePath}"`, { encoding: 'latin1' });
        
        // gitContent está em latin1 (cada caractere mojibake é 1 byte)
        // Agora converte para UTF-8
        const buffer = Buffer.from(gitContent, 'latin1');
        const fixed = buffer.toString('utf8');
        
        // Verifica se realmente converteu
        if (fixed.includes('Ã') || fixed.includes('Â')) {
            // Tenta conversão dupla
            const doubleBuffer = Buffer.from(fixed, 'latin1');
            const doubleFixed = doubleBuffer.toString('utf8');
            fs.writeFileSync(filePath, doubleFixed, 'utf8');
        } else {
            fs.writeFileSync(filePath, fixed, 'utf8');
        }
        return true;
    } catch (e) {
        // Arquivo pode não estar no git HEAD
        return false;
    }
}

// Lista de arquivos para corrigir
const filesToFix = [
    'index.html',
    '404.html',
    'posts.html',
    'data/blog.json'
];

// Adiciona posts
const postsDir = 'post';
if (fs.existsSync(postsDir)) {
    fs.readdirSync(postsDir).forEach(post => {
        const postPath = path.join(postsDir, post, 'index.html');
        if (fs.existsSync(postPath)) {
            filesToFix.push(postPath);
        }
    });
}

// Adiciona tags
const tagDir = 'tag';
if (fs.existsSync(tagDir)) {
    fs.readdirSync(tagDir).forEach(tag => {
        const tagPath = path.join(tagDir, tag, 'index.html');
        if (fs.existsSync(tagPath)) {
            filesToFix.push(tagPath);
        }
    });
}

// Adiciona categorias
const catDir = 'category';
if (fs.existsSync(catDir)) {
    fs.readdirSync(catDir).forEach(cat => {
        const catPath = path.join(catDir, cat, 'index.html');
        if (fs.existsSync(catPath)) {
            filesToFix.push(catPath);
        }
    });
}

console.log(`Processando ${filesToFix.length} arquivos do git...\n`);
let fixedCount = 0;

filesToFix.forEach(file => {
    try {
        if (fixFromGit(file)) {
            console.log(`✅ Corrigido: ${file}`);
            fixedCount++;
        }
    } catch (e) {
        console.log(`⚠️ Erro: ${file} - ${e.message}`);
    }
});

console.log(`\n✅ Concluído! ${fixedCount} arquivos corrigidos.`);
