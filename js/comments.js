// Giscus comments configuration
// INSTRUÇÕES:
// 1. Ative GitHub Discussions no repo: https://github.com/VictorHOliveira/QA_OverFlow/settings
// 2. Acesse https://giscus.app/ e configure com:
//    - Repository: VictorHOliveira/QA_OverFlow
//    - Category: General (ou Announcements)
//    - Mapping: pathname
//    - Theme: dark
//    - Language: Portuguese
// 3. Copie os data-repo-id e data-category-id e cole abaixo

function loadGiscus() {
    const container = document.getElementById('giscus-container');
    if (!container) return;

    // Limpa container caso já tenha algo
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'VictorHOliveira/QA_OverFlow');
    script.setAttribute('data-repo-id', 'R_kgDOSERSTg'); // ID do repositório
    script.setAttribute('data-category', 'General'); // Categoria
    script.setAttribute('data-category-id', 'DIC_kwDOSERSTs4C76kh'); // ID da categoria
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-lang', 'pt');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;

    container.appendChild(script);
}

// Carrega quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGiscus);
} else {
    loadGiscus();
}
