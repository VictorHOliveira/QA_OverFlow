// Este arquivo usa codificação UTF-8 para leitura/escrita de arquivos
// Encoding: UTF-8 (não alterar para evitar caracteres quebrados em pt-BR)
const fs = require('fs');
const path = require('path');

const blogPath = path.join(__dirname, 'data', 'blog.json');
const indexPath = path.join(__dirname, 'index.html');

// Read blog.json
const blogData = JSON.parse(fs.readFileSync(blogPath, 'utf-8'));

// Filter published posts
let posts = blogData.posts.filter(p => p.status === undefined || p.status === 'published');

// Sort by date (newest first)
posts.sort((a, b) => new Date(b.dated) - new Date(a.dated));

// Generate HTML for main posts
let postsHtml = '';
posts.forEach(post => {
    postsHtml += `                <article>\n` +
        `                    <h3><a href="https://qaoverflow.com/post/${post.slug}">${post.title}</a></h3>\n` +
        `                    <span class="glyphicon glyphicon-user"></span> ${post.author}\n` +
        `                    &nbsp;&nbsp;\n` +
        `                    <span class="glyphicon glyphicon-time"></span> ${post.dated}\n` +
        `                        <hr>\n` +
        `                </article>\n`;
});

// Generate HTML for recent posts (5 most recent)
let recentHtml = '';
posts.slice(0, 5).forEach(post => {
    const shortTitle = post.title.length > 40 ? post.title.substring(0, 37) + '...' : post.title;
    recentHtml += `                        <li class="list-group-item"><a href="https://qaoverflow.com/post/${post.slug}">${shortTitle}</a></li>\n`;
});

// Read current index.html
let html = fs.readFileSync(indexPath, 'utf-8');

// Replace main posts - find the div with main-content and replace articles inside
const mainRegex = /(<div class="col-md-8 main-content">)([\s\S]*?)(<\/div>\s*<div class="sidebar)/;
html = html.replace(mainRegex, `$1\n${postsHtml}\n            $3`);

// Replace recent posts in sidebar - find the first ul after "Postagens Recentes"
const sidebarRegex = /(<!-- Postagens Recentes -->[\s\S]*?<ul class="list-group">)([\s\S]*?)(<\/ul>)/;
html = html.replace(sidebarRegex, `$1\n${recentHtml}\n                    $3`);

// Update cache buster
const now = new Date().toLocaleString('pt-BR');
html = html.replace(/<!-- Cache buster: .* -->/, `<!-- Cache buster: ${now} -->`);

// Write updated index.html
fs.writeFileSync(indexPath, html, 'utf-8');
console.log(`Generated index.html with ${posts.length} posts (${posts.slice(0,5).length} in sidebar)`);
