# Deploy em qaoverflow.com/admin

## Pré-requisitos no Servidor
- Python 3.8+
- Nginx/Apache
- Certificado SSL (HTTPS obrigatório para dados financeiros)
- (Opcional) Redis para rate limiting

## Passos para Publicação

### 1. Transferir Ficheiros
Copiar toda a pasta `D:\Gestão Financeira` para o servidor (ex: `/var/www/qaoverflow/finance`)

### 2. Configurar Variáveis de Ambiente
No servidor, editar o ficheiro `.env`:
```bash
FLASK_SECRET_KEY=sua_chave_forte_aqui  # Já configurado
FLASK_DEBUG=False
```

### 3. Instalar Dependências
```bash
cd /var/www/qaoverflow/finance
pip install -r requirements.txt
```

### 4. Configurar Servidor Web (Nginx exemplo)

No `qaoverflow.com`, configurar um bloco `location` para `/admin`:

```nginx
location /admin {
    proxy_pass http://127.0.0.1:5000/admin;  # Importante: incluir /admin no proxy_pass
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect off;
}
```

**Alternativa (se a app Flask responder diretamente em /admin sem prefixo interno):**
```nginx
location /admin {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 5. Configurar WSGI Server (Gunicorn recomendado)
```bash
pip install gunicorn
gunicorn -w 4 -b 127.0.0.1:5000 wsgi:app
```

Para produção, usar systemd para manter o serviço ativo:
```ini
# /etc/systemd/system/finance.service
[Unit]
Description=Financial Management App
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/qaoverflow/finance
Environment="PATH=/var/www/qaoverflow/finance/venv/bin"
ExecStart=/var/www/qaoverflow/finance/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 wsgi:app

[Install]
WantedBy=multi-user.target
```

### 6. HTTPS (Obrigatório)
Certifique-se que o qaoverflow.com tem SSL/TLS válido (Let's Encrypt gratuito).

### 7. Verificar
Aceder: `https://qaoverflow.com/admin`

## Segurança
✅ Dados encriptados (Fernet)
✅ Passwords com hash (bcrypt)
✅ CSRF Protection
✅ Rate Limiting
✅ Sessões seguras
✅ Chave em `.env` (não versionar)

## Backup
Fazer backup regular de:
- `financial.db` (base de dados)
- `secret.key` (chave de encriptação)

Sem a `secret.key`, NÃO conseguirá desencriptar os dados!
