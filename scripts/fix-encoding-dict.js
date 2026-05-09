const fs = require('fs');
const path = require('path');

const postsJsonPath = path.join(__dirname, '..', 'src', '_data', 'posts.json');
const posts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));

const wordReplacements = [
    { pattern: /Sï¿½nior/gi, replacement: 'Sênior' },
    { pattern: /sï¿½nior/gi, replacement: 'sênior' },
    { pattern: /Sï¿½/gi, replacement: 'Sê' },
    { pattern: /sï¿½/gi, replacement: 'sê' },
    { pattern: /Dï¿½cada/gi, replacement: 'Década' },
    { pattern: /dï¿½cada/gi, replacement: 'década' },
    { pattern: /automaï¿½ï¿½o/gi, replacement: 'automação' },
    { pattern: /Automaï¿½ï¿½o/gi, replacement: 'Automação' },
    { pattern: /AUTOMAï¿½ï¿½O/gi, replacement: 'AUTOMAÇÃO' },
    { pattern: /apï¿½s/gi, replacement: 'após' },
    { pattern: /Apï¿½s/gi, replacement: 'Após' },
    { pattern: /nï¿½o/gi, replacement: 'não' },
    { pattern: /Nï¿½o/gi, replacement: 'Não' },
    { pattern: /tï¿½o/gi, replacement: 'tão' },
    { pattern: /Tï¿½o/gi, replacement: 'Tão' },
    { pattern: /serï¿½/gi, replacement: 'será' },
    { pattern: /Serï¿½/gi, replacement: 'Será' },
    { pattern: /vï¿½/gi, replacement: 'vá' },
    { pattern: /Vï¿½/gi, replacement: 'Vá' },
    { pattern: /verï¿½/gi, replacement: 'verá' },
    { pattern: /terï¿½/gi, replacement: 'terá' },
    { pattern: /fï¿½cil/gi, replacement: 'fácil' },
    { pattern: /Fï¿½cil/gi, replacement: 'Fácil' },
    { pattern: /difï¿½cil/gi, replacement: 'difícil' },
    { pattern: /Difï¿½cil/gi, replacement: 'Difícil' },
    { pattern: /bï¿½sico/gi, replacement: 'básico' },
    { pattern: /Bï¿½sico/gi, replacement: 'Básico' },
    { pattern: /prï¿½/gi, replacement: 'pré' },
    { pattern: /Prï¿½/gi, replacement: 'Pré' },
    { pattern: /pï¿½gina/gi, replacement: 'página' },
    { pattern: /Pï¿½gina/gi, replacement: 'Página' },
    { pattern: /mï¿½/gi, replacement: 'má' },
    { pattern: /Mï¿½/gi, replacement: 'Má' },
    { pattern: /mï¿½dulo/gi, replacement: 'módulo' },
    { pattern: /Mï¿½dulo/gi, replacement: 'Módulo' },
    { pattern: /cï¿½digo/gi, replacement: 'código' },
    { pattern: /Cï¿½digo/gi, replacement: 'Código' },
    { pattern: /lï¿½gica/gi, replacement: 'lógica' },
    { pattern: /Lï¿½gica/gi, replacement: 'Lógica' },
    { pattern: /pï¿½blico/gi, replacement: 'público' },
    { pattern: /Pï¿½blico/gi, replacement: 'Público' },
    { pattern: /anï¿½lise/gi, replacement: 'análise' },
    { pattern: /Anï¿½lise/gi, replacement: 'Análise' },
    { pattern: /anï¿½lises/gi, replacement: 'análises' },
    { pattern: /Anï¿½lises/gi, replacement: 'Análises' },
    { pattern: /gerï¿½ncia/gi, replacement: 'gerência' },
    { pattern: /Gerï¿½ncia/gi, replacement: 'Gerência' },
    { pattern: /histï¿½ria/gi, replacement: 'história' },
    { pattern: /Histï¿½ria/gi, replacement: 'História' },
    { pattern: /usuï¿½rio/gi, replacement: 'usuário' },
    { pattern: /Usuï¿½rio/gi, replacement: 'Usuário' },
    { pattern: /usuï¿½rios/gi, replacement: 'usuários' },
    { pattern: /Usuï¿½rios/gi, replacement: 'Usuários' },
    { pattern: /configuraï¿½ï¿½o/gi, replacement: 'configuração' },
    { pattern: /Configuraï¿½ï¿½o/gi, replacement: 'Configuração' },
    { pattern: /configuraï¿½ï¿½es/gi, replacement: 'configurações' },
    { pattern: /Configuraï¿½ï¿½es/gi, replacement: 'Configurações' },
    { pattern: /implementaï¿½ï¿½o/gi, replacement: 'implementação' },
    { pattern: /Implementaï¿½ï¿½o/gi, replacement: 'Implementação' },
    { pattern: /validaï¿½ï¿½o/gi, replacement: 'validação' },
    { pattern: /Validaï¿½ï¿½o/gi, replacement: 'Validação' },
    { pattern: /execuï¿½ï¿½o/gi, replacement: 'execução' },
    { pattern: /Execuï¿½ï¿½o/gi, replacement: 'Execução' },
    { pattern: /integraï¿½ï¿½o/gi, replacement: 'integração' },
    { pattern: /Integraï¿½ï¿½o/gi, replacement: 'Integração' },
    { pattern: /comunicaï¿½ï¿½o/gi, replacement: 'comunicação' },
    { pattern: /Comunicaï¿½ï¿½o/gi, replacement: 'Comunicação' },
    { pattern: /aplicaï¿½ï¿½o/gi, replacement: 'aplicação' },
    { pattern: /Aplicaï¿½ï¿½o/gi, replacement: 'Aplicação' },
    { pattern: /aplicaï¿½ï¿½es/gi, replacement: 'aplicações' },
    { pattern: /Aplicaï¿½ï¿½es/gi, replacement: 'Aplicações' },
    { pattern: /soluï¿½ï¿½o/gi, replacement: 'solução' },
    { pattern: /Soluï¿½ï¿½o/gi, replacement: 'Solução' },
    { pattern: /soluï¿½ï¿½es/gi, replacement: 'soluções' },
    { pattern: /Soluï¿½ï¿½es/gi, replacement: 'Soluções' },
    { pattern: /funcionalidade/gi, replacement: 'funcionalidade' },
    { pattern: /Funcionalidade/gi, replacement: 'Funcionalidade' },
    { pattern: /funcionalidades/gi, replacement: 'funcionalidades' },
    { pattern: /Funcionalidades/gi, replacement: 'Funcionalidades' },
    { pattern: /qualidade/gi, replacement: 'qualidade' },
    { pattern: /Qualidade/gi, replacement: 'Qualidade' },
    { pattern: /desenvolvimento/gi, replacement: 'desenvolvimento' },
    { pattern: /Desenvolvimento/gi, replacement: 'Desenvolvimento' },
    { pattern: /teste/gi, replacement: 'teste' },
    { pattern: /Teste/gi, replacement: 'Teste' },
    { pattern: /testes/gi, replacement: 'testes' },
    { pattern: /Testes/gi, replacement: 'Testes' },
    { pattern: /ï¿½/gi, replacement: 'é' },
    { pattern: /Ã©/gi, replacement: 'é' },
    { pattern: /Ã¡/gi, replacement: 'á' },
    { pattern: /Ã /gi, replacement: 'à' },
    { pattern: /Ã£/gi, replacement: 'ã' },
    { pattern: /Ã¢/gi, replacement: 'â' },
    { pattern: /Ãª/gi, replacement: 'ê' },
    { pattern: /Ã­/gi, replacement: 'í' },
    { pattern: /Ã³/gi, replacement: 'ó' },
    { pattern: /Ã´/gi, replacement: 'ô' },
    { pattern: /Ãµ/gi, replacement: 'õ' },
    { pattern: /Ãº/gi, replacement: 'ú' },
    { pattern: /Ã¼/gi, replacement: 'ü' },
    { pattern: /Ã§/gi, replacement: 'ç' },
    { pattern: /Ã‰/gi, replacement: 'É' },
    { pattern: /Ã/gi, replacement: 'Á' },
    { pattern: /Ã€/gi, replacement: 'À' },
    { pattern: /Ãƒ/gi, replacement: 'Ã' },
    { pattern: /Ã‚/gi, replacement: 'Â' },
    { pattern: /ÃŠ/gi, replacement: 'Ê' },
    { pattern: /Ã/gi, replacement: 'Í' },
    { pattern: /Ã“/gi, replacement: 'Ó' },
    { pattern: /Ã”/gi, replacement: 'Ô' },
    { pattern: /Ã•/gi, replacement: 'Õ' },
    { pattern: /Ãš/gi, replacement: 'Ú' },
    { pattern: /Ãœ/gi, replacement: 'Ü' },
    { pattern: /Ã‡/gi, replacement: 'Ç' },
];

const charReplacements = [
    { pattern: /Pr\?ticas/gi, replacement: 'Práticas' },
    { pattern: /pr\?ticas/gi, replacement: 'práticas' },
    { pattern: /Pr\?tica/gi, replacement: 'Prática' },
    { pattern: /pr\?tica/gi, replacement: 'prática' },
    { pattern: /S\?nior/gi, replacement: 'Sênior' },
    { pattern: /s\?nior/gi, replacement: 'sênior' },
    { pattern: /guia/gi, replacement: 'guia' },
    { pattern: /n\?o/gi, replacement: 'não' },
    { pattern: /N\?o/gi, replacement: 'Não' },
    { pattern: /t\?o/gi, replacement: 'tão' },
    { pattern: /T\?o/gi, replacement: 'Tão' },
    { pattern: /s\?/gi, replacement: 'sê' },
    { pattern: /S\?/gi, replacement: 'Sê' },
    { pattern: /d\?cada/gi, replacement: 'década' },
    { pattern: /D\?cada/gi, replacement: 'Década' },
    { pattern: /est\?/gi, replacement: 'está' },
    { pattern: /Est\?/gi, replacement: 'Está' },
    { pattern: /ser\?/gi, replacement: 'será' },
    { pattern: /Ser\?/gi, replacement: 'Será' },
    { pattern: /\? /g, replacement: '? ' },
];

const qaContextWords = {
    'teste': 'teste',
    'testes': 'testes',
    'automação': 'automação',
    'automações': 'automações',
    'qualidade': 'qualidade',
    'software': 'software',
    'desenvolvimento': 'desenvolvimento',
    'desenvolvedor': 'desenvolvedor',
    'desenvolvedores': 'desenvolvedores',
    'qa': 'qa',
    'QA': 'QA',
    'scrum': 'scrum',
    'sprint': 'sprint',
    'sprints': 'sprints',
    'backlog': 'backlog',
    'product': 'product',
    'owner': 'owner',
    'daily': 'daily',
    'planning': 'planning',
    'review': 'review',
    'retrospective': 'retrospective',
    'ci': 'ci',
    'cd': 'cd',
    'devops': 'devops',
    'git': 'git',
    'github': 'github',
    'jenkins': 'jenkins',
    'playwright': 'playwright',
    'cypress': 'cypress',
    'selenium': 'selenium',
    'api': 'api',
    'apis': 'apis',
    'ui': 'ui',
    'ux': 'ux',
    'e2e': 'e2e',
    'end-to-end': 'end-to-end',
    'unit': 'unit',
    'unitários': 'unitários',
    'integração': 'integração',
    'regressão': 'regressão',
    'smoke': 'smoke',
    'sanity': 'sanity',
    'performance': 'performance',
    'carga': 'carga',
    'stress': 'stress',
    'segurança': 'segurança',
    'acessibilidade': 'acessibilidade',
    'contrato': 'contrato',
    'contract': 'contract',
    'mock': 'mock',
    'stub': 'stub',
    'fake': 'fake',
    'spy': 'spy',
    'page': 'page',
    'object': 'object',
    'model': 'model',
    'pom': 'pom',
    'design': 'design',
    'patterns': 'patterns',
    'padrões': 'padrões',
    'arquitetura': 'arquitetura',
    'estrutura': 'estrutura',
    'maintainable': 'maintainable',
    'sustentável': 'sustentável',
    'escalável': 'escalável',
    'robusto': 'robusto',
    'confiável': 'confiável',
    'rápido': 'rápido',
    'lento': 'lento',
    'eficiente': 'eficiente',
    'ineficiente': 'ineficiente',
    'simples': 'simples',
    'complexo': 'complexo',
    'fácil': 'fácil',
    'difícil': 'difícil',
    'bom': 'bom',
    'ruim': 'ruim',
    'ótimo': 'ótimo',
    'péssimo': 'péssimo',
    'melhor': 'melhor',
    'pior': 'pior',
    'novo': 'novo',
    'velho': 'velho',
    'grande': 'grande',
    'pequeno': 'pequeno',
    'alto': 'alto',
    'baixo': 'baixo',
    'muitos': 'muitos',
    'poucos': 'poucos',
    'todos': 'todos',
    'nenhum': 'nenhum',
    'alguns': 'alguns',
    'cada': 'cada',
    'qualquer': 'qualquer',
    'mesmo': 'mesmo',
    'outro': 'outro',
    'primeiro': 'primeiro',
    'último': 'último',
    'próximo': 'próximo',
    'anterior': 'anterior',
    'atual': 'atual',
    'passado': 'passado',
    'futuro': 'futuro',
    'hoje': 'hoje',
    'amanhã': 'amanhã',
    'ontem': 'ontem',
    'agora': 'agora',
    'depois': 'depois',
    'antes': 'antes',
    'quando': 'quando',
    'enquanto': 'enquanto',
    'até': 'até',
    'desde': 'desde',
    'para': 'para',
    'de': 'de',
    'em': 'em',
    'por': 'por',
    'com': 'com',
    'sem': 'sem',
    'sobre': 'sobre',
    'entre': 'entre',
    'através': 'através',
    'dentro': 'dentro',
    'fora': 'fora',
    'acima': 'acima',
    'abaixo': 'abaixo',
    'esquerda': 'esquerda',
    'direita': 'direita',
    'frente': 'frente',
    'trás': 'trás',
    'sim': 'sim',
    'não': 'não',
    'talvez': 'talvez',
    'provavelmente': 'provavelmente',
    'certamente': 'certamente',
    'definitivamente': 'definitivamente',
    'muito': 'muito',
    'pouco': 'pouco',
    'bem': 'bem',
    'mal': 'mal',
    'mais': 'mais',
    'menos': 'menos',
    'tão': 'tão',
    'quanto': 'quanto',
    'como': 'como',
    'que': 'que',
    'qual': 'qual',
    'quem': 'quem',
    'cujo': 'cujo',
    'onde': 'onde',
    'quando': 'quando',
    'porquê': 'porquê',
    'porque': 'porque',
    'se': 'se',
    'então': 'então',
    'senão': 'senão',
    'mas': 'mas',
    'porém': 'porém',
    'contudo': 'contudo',
    'entretanto': 'entretanto',
    'todavia': 'todavia',
    'além': 'além',
    'ainda': 'ainda',
    'também': 'também',
    'inclusive': 'inclusive',
    'mesmo': 'mesmo',
    'até': 'até',
    'inclusive': 'inclusive',
    'até': 'até',
    'mesmo': 'mesmo',
    'ou': 'ou',
    'nem': 'nem',
    'quer': 'quer',
    'seja': 'seja',
    'ora': 'ora',
    'já': 'já',
    'logo': 'logo',
    'portanto': 'portanto',
    'por': 'por',
    'isso': 'isso',
    'isto': 'isto',
    'aquilo': 'aquilo',
    'ele': 'ele',
    'ela': 'ela',
    'eles': 'eles',
    'elas': 'elas',
    'eu': 'eu',
    'você': 'você',
    'nós': 'nós',
    'vós': 'vós',
    'me': 'me',
    'te': 'te',
    'se': 'se',
    'nos': 'nos',
    'vos': 'vos',
    'o': 'o',
    'a': 'a',
    'os': 'os',
    'as': 'as',
    'do': 'do',
    'da': 'da',
    'dos': 'dos',
    'das': 'das',
    'no': 'no',
    'na': 'na',
    'nos': 'nos',
    'nas': 'nas',
    'pelo': 'pelo',
    'pela': 'pela',
    'pelos': 'pelos',
    'pelas': 'pelas',
    'ao': 'ao',
    'à': 'à',
    'aos': 'aos',
    'às': 'às',
    'pro': 'pro',
    'pra': 'pra',
    'pros': 'pros',
    'pras': 'pras',
    'dum': 'dum',
    'duma': 'duma',
    'duns': 'duns',
    'dumas': 'dumas',
    'num': 'num',
    'numa': 'numa',
    'nuns': 'nuns',
    'numas': 'numas',
};

function countBadChars(str) {
    if (!str) return 0;
    const badChars = ['ï¿½', '�', '?'];
    let count = 0;
    badChars.forEach(char => {
        const regex = new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        count += (str.match(regex) || []).length;
    });
    return count;
}

function fixTextWithDict(str) {
    if (!str || typeof str !== 'string') return str;
    
    const beforeCount = countBadChars(str);
    if (beforeCount === 0) return str;
    
    let result = str;
    
    wordReplacements.forEach(({ pattern, replacement }) => {
        result = result.replace(pattern, replacement);
    });
    
    charReplacements.forEach(({ pattern, replacement }) => {
        result = result.replace(pattern, replacement);
    });
    
    const afterCount = countBadChars(result);
    
    return { text: result, before: beforeCount, after: afterCount };
}

console.log('=== Fixing Encoding with Dictionary Heuristics ===\n');

const summary = {
    total: 0,
    improved: 0,
    noImprovement: 0,
    details: []
};

posts.forEach((post, index) => {
    if (!post.content) {
        console.log(`[${index + 1}] ${post.slug}: No content`);
        return;
    }
    
    summary.total++;
    
    const contentResult = fixTextWithDict(post.content);
    const summaryResult = post.summary ? fixTextWithDict(post.summary) : null;
    
    console.log(`[${index + 1}] ${post.slug}`);
    console.log(`  Content: ${contentResult.before} → ${contentResult.after} bad chars`);
    
    if (contentResult.after < contentResult.before) {
        posts[index].content = contentResult.text;
        summary.improved++;
        console.log(`  ✓ Improved!`);
    } else if (contentResult.after === 0 && contentResult.before > 0) {
        posts[index].content = contentResult.text;
        summary.improved++;
        console.log(`  ✓ Perfectly fixed!`);
    } else {
        summary.noImprovement++;
        console.log(`  ⚠ No improvement`);
    }
    
    if (summaryResult && summaryResult.after < summaryResult.before) {
        posts[index].summary = summaryResult.text;
    }
    
    summary.details.push({
        slug: post.slug,
        before: contentResult.before,
        after: contentResult.after
    });
});

fs.writeFileSync(postsJsonPath, JSON.stringify(posts, null, 2), 'utf8');

console.log('\n=== Summary ===');
console.log(`Total posts processed: ${summary.total}`);
console.log(`  Improved: ${summary.improved}`);
console.log(`  No improvement: ${summary.noImprovement}`);

if (summary.noImprovement > 0) {
    console.log('\n=== Posts for Manual Review ===');
    summary.details
        .filter(d => d.after > 0)
        .forEach(d => {
            console.log(`  - ${d.slug}: ${d.before} → ${d.after} bad chars`);
        });
}

console.log('\nDone! posts.json updated.');
