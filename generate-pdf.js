// Encoding: UTF-8 (suporte a caracteres especiais pt-BR)
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    const htmlPath = path.join(__dirname, 'tests/report/certificado-qualidade.html');
    console.log('Loading HTML:', htmlPath);
    
    await page.goto(ile://, {
        waitUntil: 'networkidle0'
    });
    
    console.log('Generating PDF...');
    await page.pdf({
        path: 'certificado-qualidade-qaoverflow.pdf',
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });
    
    await browser.close();
    console.log('PDF generated: certificado-qualidade-qaoverflow.pdf');
})();
