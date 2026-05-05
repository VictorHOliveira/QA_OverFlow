// Encoding: UTF-8 (suporte a caracteres especiais pt-BR)
// Este script corrige mojibake (UTF-8 lido como Windows-1252/latin1)
const fs = require('fs');
const path = require('path');

// Função para corrigir mojibake (UTF-8 lido como Windows-1252)
function fixMojibake(text) {
    // Se não tem caracteres problemáticos, retorna original
    if (!text.includes('Ã')) return text;
    
    try {
        // Converte texto UTF-8 para bytes usando Windows-1252 (latin1)
        const buffer = Buffer.from(text, 'latin1');
        // Reconverte bytes para UTF-8
        return buffer.toString('utf8');
    } catch (e) {
        return text;
    }
}

// Função para processar arquivo
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fixed = fixMojibake(content);
        
        if (content !== fixed) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            return true; // Foi corrigido
        }
        return false; // Já estava correto
    } catch (e) {
        console.error(`Erro em ${filePath}:`, e.message);
        return false;
    }
}

// Arquivos para processar
const filesToProcess = [
    'index.html',
    '404.html', 
    'posts.html',
    'data/blog.json'
];

// Adiciona todos os posts
const postsDir = 'post';
if (fs.existsSync(postsDir)) {
    fs.readdirSync(postsDir).forEach(post => {
        const postPath = path.join(postsDir, post, 'index.html');
        if (fs.existsSync(postPath)) {
            filesToProcess.push(postPath);
        }
    });
}

// Adiciona tags e categorias
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

console.log('Processando', filesToProcess.length, 'arquivos...');
let corrected = 0;

filesToProcess.forEach(file => {
    if (processFile(file)) {
        console.log('✓ Corrigido:', file);
        corrected++;
    }
});

console.log(`\nConcluído! ${corrected} arquivos corrigidos.`);
