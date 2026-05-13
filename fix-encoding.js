const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const blogPath = path.join(ROOT, 'data', 'blog.json');
const blogData = JSON.parse(fs.readFileSync(blogPath, 'utf-8'));

function readFile(p) {
  return fs.readFileSync(p, 'utf-8');
}

function writeFile(p, content) {
  fs.writeFileSync(p, content, 'utf-8');
}

// Build a mapping of corrupted → correct text from blog.json
// The HTML files contain blog-derived strings with corrupted accented chars.
// We'll match by stripping accents and comparing, then replace with correct.

function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Collect all correct strings from blog.json
const correctStrings = new Map(); // stripped → original (correct)
function addCorrect(s) {
  if (!s || typeof s !== 'string') return;
  const stripped = stripAccents(s);
  if (!correctStrings.has(stripped)) {
    correctStrings.set(stripped, s);
  }
}

blogData.settings && Object.values(blogData.settings).forEach(v => addCorrect(v));
if (blogData.posts) {
  blogData.posts.forEach(p => {
    addCorrect(p.title);
    addCorrect(p.body);
    addCorrect(p.summary);
    addCorrect(p.category);
    addCorrect(p.author);
    if (p.tags) p.tags.forEach(t => addCorrect(t));
  });
}

// Fix encoding in a text by finding corrupted versions of known correct strings
function fixKnownStrings(text) {
  for (const [stripped, correct] of correctStrings) {
    try {
      // Skip very short strings to avoid false matches
      if (stripped.length < 5) continue;
      
      const corruptedPattern = stripped.replace(/[a-zA-Z0-9\s.,!?;:'"()<>/-]/g, (c) => {
        if (/[a-zA-Z]/.test(c)) return c;
        return '\\' + c;
      }).replace(/[?]+/g, '[\\?\\uFFFD]+');
      
      // Use word boundaries to avoid partial word matches
      const regex = new RegExp('\\b' + corruptedPattern + '\\b', 'g');
      text = text.replace(regex, (match) => {
        if (stripAccents(match) === stripAccents(correct)) {
          return correct;
        }
        return match;
      });
    } catch(e) {
      // Skip regex errors
    }
  }
  return text;
}

// Direct replacement map for corrupted Portuguese text
// Key: corrupted text fragment, Value: correct text
const directFixes = {
  // index.html specific (? corruption)
  'Automa??o de Testes, QA e Overflow': 'Automação de Testes, QA e Overflow',
  'Automa??o de Testes, Overflow': 'Automação de Testes, Overflow',
  'Automa??o de Testes e Overflow': 'Automação de Testes e Overflow',
  'Automa??o de Testes': 'Automação de Testes',
  'Automa??o': 'Automação',
  's pr?ticas de testes automatizados': 's práticas de testes automatizados',
  'melhores pr?ticas de testes automatizados': 'melhores práticas de testes automatizados',
  'pr?ticas de testes': 'práticas de testes',

  // FFFD corruption replacements (posts.html, category/*, tag/*, post/*)
  'Boas Pr\uFFFDticas': 'Boas Práticas',
  'Pr\uFFFDtica': 'Prática',
  'Pr\uFFFDticas': 'Práticas',
  'Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o': 'Automação',
  'Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o de Testes': 'Automação de Testes',
  'Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o de testes': 'Automação de Testes',
  'experi\uFFFDncia': 'experiência',
  'experi\uFFFDncias': 'experiências',
  'S\uFFFDnior': 'Sênior',
  'd\uFFFDcada': 'década',
  'misso': 'missão',
  'Misso': 'Missão',
  'n\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o': 'não',
  's\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o': 'são',
  'est\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD': 'estão',
  't\uFFFDcnica': 'técnica',
  't\uFFFDcnicas': 'técnicas',
  't\uFFFDpicos': 'tópicos',
  't\uFFFDpico': 'tópico',
  'pr\uFFFDtico': 'prático',
  'pr\uFFFDticos': 'práticos',
  'pr\uFFFDtica': 'prática',
  'pr\uFFFDticas': 'práticas',
  'estrat\uFFFDgias': 'estratégias',
  'estrat\uFFFDgia': 'estratégia',
  'qualidade de software': 'Qualidade de Software',
  'automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o': 'automação',
  'automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o de Testes': 'Automação de Testes',
  'Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o de Testes': 'Automação de Testes',
  'Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o, QA e Overflow': 'Automação, QA e Overflow',
};

// Additional fixes discovered during analysis
const moreFixes = {
  // Posts.html specific
  'Boas Pr\uFFFDticas em Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o de Testes': 'Boas Práticas em Automação de Testes',
  'Guia para Iniciantes': 'Guia para Iniciantes',
  'O que \uFFFD Guia para Iniciantes': 'O que é? Guia para Iniciantes',
  'Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o, QA e Overflow': 'Automação, QA e Overflow',
  
  // Category pages
  'Informa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD es': 'Informações',
  'Se\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o': 'Seção',
  'n\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o': 'não',
  't\uFFFDm': 'têm',
  'h\uFFFD mais de': 'há mais de',
  'est\uFFFD na': 'está na',
  
  // Sobre page
  'experi\uFFFDncia de 13 anos': 'experiência de 13 anos',
  'monol\uFFFDticas': 'monolíticas',
  'microsservi\uFFFDos': 'microsserviços',
  'escal\uFFFDvel': 'escalável',
  
  // Tag pages  
  'Qualidade de Software e Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o de Testes': 'Qualidade de Software e Automação de Testes',
  'Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD o de testes': 'Automação de Testes',
  
  // Post pages - common words
  'pa\uFFFDs': 'país',
  'conte\uFFFDdo': 'conteúdo',
  'conte\uFFFDdos': 'conteúdos',
  'n\uFFFDvel': 'nível',
  'n\uFFFDveis': 'níveis',
  'linguagem': 'linguagem',
  'espec\uFFFDfica': 'específica',
  'espec\uFFFDficos': 'específicos',
  'carreira em QA': 'carreira em QA',
  'comunidade de QA': 'comunidade de QA',
};

// Merge fixes
Object.assign(directFixes, moreFixes);

// Also scan HTML for FFFD patterns and generate replacements
function autoFixFFFD(text) {
  // Common Portuguese words with FFFD - auto-replace based on context
  const patterns = [
    // Two FFFD in a row = ç (typically)
    [/automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([\s,.<>])/gi, 'automaçã$1'], 
    [/Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([\s,.<>\"])/g, 'Automação$1'],
    
    // Single FFFD in specific context
    [/([Pp])r\uFFFDticas/g, '$1ráticas'],
    [/([Pp])r\uFFFDtica/g, '$1rática'],
    [/([Pp])r\uFFFDtico/g, '$1rático'],
    [/([Ee])xperi\uFFFDncia/g, '$1xperiência'],
    [/([Ee])xperi\uFFFDncias/g, '$1xperiências'],
    [/([Ss])\uFFFDnior/g, '$1ênior'],
    [/([Dd])\uFFFDcada/g, '$1écada'],
    [/([Mm])iss\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD/g, '$1issão'],
    [/([Ii])nforma\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([es])/g, '$1nformaçõe$2'],
    [/Informa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([es])/g, 'Informaçõe$1'],
    [/([Ss])e\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([\s,.<>\"])/g, '$1eção$2'],

    // n e s t a n t e
    [/n\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([\s,.<>\"\'\)])/g, 'não$1'],
    [/s\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([\s,.<>\"\'\)])/g, 'são$1'],
    [/est\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([\s,.<>\"\'\)])/g, 'estão$1'],
    [/n\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFDvel/g, 'nível'],
    [/n\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFDveis/g, 'níveis'],
    
    // Other common patterns
    [/conte\uFFFDdo/g, 'conteúdo'],
    [/conte\uFFFDdos/g, 'conteúdos'],
    [/espec\uFFFDfica/g, 'específica'],
    [/espec\uFFFDficos/g, 'específicos'],
    [/espec\uFFFDfico/g, 'específico'],
    [/pa\uFFFDs/g, 'país'],
    [/monol\uFFFDticas/g, 'monolíticas'],
    [/monol\uFFFDtico/g, 'monolítico'],
    [/microsservi\uFFFDos/g, 'microsserviços'],
    [/escal\uFFFDvel/g, 'escalável'],
    [/linguagem/g, 'linguagem'],
    
    // Fix category references
    [/boas-Pr\uFFFDticas/gi, 'boas-práticas'],
    [/boas pr\uFFFDticas/gi, 'boas práticas'],
    [/Boas Pr\uFFFDticas/g, 'Boas Práticas'],
    [/boas-pr\uFFFDticas/gi, 'boas-práticas'],

    // Fix "estratégia" words  
    [/estrat\uFFFDgia/g, 'estratégia'],
    [/estrat\uFFFDgias/g, 'estratégias'],

    // "técnica"
    [/t\uFFFDcnica/g, 'técnica'],
    [/t\uFFFDcnicas/g, 'técnicas'],
    [/t\uFFFDcnico/g, 'técnico'],
    
    // "tópicos"
    [/t\uFFFDpicos/g, 'tópicos'],
    [/t\uFFFDpico/g, 'tópico'],
    
    // "também"
    [/tamb\uFFFDm/g, 'também'],
    
    // "você"
    [/voc\uFFFD/g, 'você'],
    [/voc\uFFFDs/g, 'vocês'],
    
    // "há"
    [/h\uFFFD([\s,.<>\"\'\)])/g, 'há$1'],
    
    // "está"
    [/est\uFFFD([\s,.<>\"\'\)])/g, 'está$1'],
    
    // "là" = "lá"
    [/l\uFFFD([\s,.<>\"\'\)])/g, 'lá$1'],

    // For post content - longer patterns
    [/Automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([\s,.<>\"\'\)])/g, 'Automação$1'],
    [/automa\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD([\s,.<>\"\'\)])/g, 'automação$1'],
    [/(\w)ç\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD(\w)/g, '$1ção$2'],
  ];
  
  for (const [regex, replacement] of patterns) {
    text = text.replace(regex, replacement);
  }
  
  return text;
}

// Also replace remaining FFFD with a best guess based on position
function cleanupRemainingFFFD(text) {
  // Replace any remaining FFFD with é (most common), but this is a last resort
  text = text.replace(/\uFFFD/g, '');
  return text;
}

// Fix "Automao" → "Automação" (when FFFD was stripped but only "o" remains)
function fixRemainingCorruption(text) {
  const fixes = {
    'Automao': 'Automação',
    'automao': 'automação',
    'Automao de Testes': 'Automação de Testes',
    'automao de Testes': 'Automação de Testes',
    'automao de testes': 'automação de testes',
    'Automao, QA': 'Automação, QA',
    'Automao e Overflow': 'Automação e Overflow',
    'Automao de testes': 'Automação de Testes',
    
    // Fix bugs introduced by the fix script itself
    'aágeis': 'ágeis',
    'áágeis': 'ágeis',
    'ááágeis': 'ágeis',
    'áááágeis': 'ágeis',
    'aáágeis': 'ágeis',
    'ágile': 'agile',
    '/tag/ágile/': '/tag/agile/',
    'tag/ágile': 'tag/agile',
    
    // Fix canonical URLs that got accents in slug
    'category/boas-práticas/': 'category/boas-praticas/',
    '/category/boas-práticas': '/category/boas-praticas',
    
    // Fix any URL paths that got accents  
    'boas-práticas"': 'boas-praticas"',
    'boas-práticas/': 'boas-praticas/',
    '/boas-práticas': '/boas-praticas',
    
    // Fix tag URLs with accents - the slug should NOT have accents
    'href="https://qaoverflow.com/tag/automação"': 'href="https://qaoverflow.com/tag/automacao"',
    'href="/tag/automação"': 'href="/tag/automacao"',
    '/tag/automação': '/tag/automacao',
    
    // Fix post links with accented URLs
    'href="https://qaoverflow.com/post/boas-praticas-em-automação-de-testes-um-guia-para-2026"': 'href="https://qaoverflow.com/post/boas-praticas-em-automacao-de-testes-um-guia-para-2026"',
    '/post/boas-praticas-em-automação-de-testes-um-guia-para-2026': '/post/boas-praticas-em-automacao-de-testes-um-guia-para-2026',
    
    // Remove duplicate tags in tag cloud
    // The pattern: two <a> tags with same href but different display text
  };
  for (const [corrupted, correct] of Object.entries(fixes)) {
    text = text.split(corrupted).join(correct);
  }
  return text;
}

// Remove duplicate tag cloud entries (same href appears twice in the tag list)
function removeDuplicateTags(text) {
  // Find the tag cloud by looking for the Tags panel
  // Pattern: start at <strong>Tags</strong> and end at the </ul> that closes the tag list
  const tagHeader = '<strong>Tags</strong>';
  const tagIdx = text.indexOf(tagHeader);
  if (tagIdx === -1) return text;
  
  // Find the <ul class="list-inline"> after the Tags header
  const ulStart = text.indexOf('<ul class="list-inline">', tagIdx);
  if (ulStart === -1) return text;
  
  const ulEnd = text.indexOf('</ul>', ulStart);
  if (ulEnd === -1) return text;
  
  const before = text.substring(0, ulStart + '<ul class="list-inline">'.length);
  const tagContent = text.substring(ulStart + '<ul class="list-inline">'.length, ulEnd);
  const after = text.substring(ulEnd);
  
  // Extract all <a> tags, keeping only the first occurrence of each href
  const tagRegex = /<a\s+[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/gi;
  const seen = new Set();
  const newTags = [];
  let match;
  
  while ((match = tagRegex.exec(tagContent)) !== null) {
    const href = match[1].toLowerCase().trim();
    if (!seen.has(href)) {
      seen.add(href);
      newTags.push(match[0]);
    }
  }
  
  if (newTags.length === 0) return text;
  
  // Rebuild: only change the tag list content, preserve everything else
  return before + '\n                            ' + newTags.join('\n') + '\n                        ' + after;
}

function fixHtmlFile(filePath) {
  let content = readFile(filePath);
  const original = content;
  
  // Step 1: Apply direct text replacements
  for (const [corrupted, correct] of Object.entries(directFixes)) {
    content = content.split(corrupted).join(correct);
  }
  
  // Step 2: Try to fix known blog-derived strings
  content = fixKnownStrings(content);
  
  // Step 3: Auto-fix FFFD patterns (for files with replacement chars)
  if (content.indexOf('\uFFFD') !== -1) {
    content = autoFixFFFD(content);
  }
  
  // Step 4: Cleanup any remaining FFFD chars
  content = cleanupRemainingFFFD(content);
  
  // Step 5: Fix remaining corruption patterns (e.g., "Automao" → "Automação")
  content = fixRemainingCorruption(content);
  
  // Step 6: Remove duplicate tag cloud entries
  content = removeDuplicateTags(content);
  
  if (content !== original) {
    writeFile(filePath, content);
    return true;
  }
  return false;
}

// Find all HTML files
function findHtmlFiles(dir, excludeDirs = ['node_modules', '.git', '_site', 'tests']) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeDirs.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath, excludeDirs));
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Main
console.log(`Loaded ${correctStrings.size} correct strings from blog.json`);

const htmlFiles = findHtmlFiles(ROOT);
console.log(`Found ${htmlFiles.length} HTML files to process`);

let fixed = 0;
let errors = 0;
for (const file of htmlFiles) {
  try {
    if (fixHtmlFile(file)) {
      const rel = path.relative(ROOT, file);
      console.log(`  FIXED: ${rel}`);
      fixed++;
    }
  } catch (err) {
    const rel = path.relative(ROOT, file);
    console.error(`  ERROR: ${rel}: ${err.message}`);
    errors++;
  }
}

console.log(`\nDone! ${fixed} files fixed, ${errors} errors.`);
