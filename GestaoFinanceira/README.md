# Sistema de Gestão Financeira Pessoal

Sistema web local para controlo de despesas e rendimentos com criptografia de dados.

## Segurança Implementada

✅ **Criptografia de Dados**
- Valores e descrições encriptados com Fernet (cryptography)
- Passwords com hash bcrypt (não reversível)
- Chave de encriptação em `secret.key` (NUNCA partilhar)

✅ **Proteção Web**
- CSRF Protection (Flask-WTF)
- Rate Limiting (anti força bruta)
- Sessões seguras (HTTPOnly, SameSite, Secure cookies)
- Validação de propriedade de dados (user_id)

## Configuração para Produção

1. **Instalar dependências:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurar variáveis de ambiente (.env):**
   ```bash
   FLASK_SECRET_KEY=sua_chave_secreta_forte_gerada_com_python_secrets_token_hex_32
   FLASK_DEBUG=False
   ```

3. **Gerar chave secreta:**
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

4. **Guardar chaves:**
   - `secret.key` - Chave de encriptação da BD (ficheiro físico)
   - `.env` - Chave secreta Flask (variável ambiente)

5. **Para publicar em qaoverflow.com/admin:**
   - Configurar proxy reverso no servidor web
   - Usar HTTPS (obrigatório para dados financeiros)
   - Usar servidor WSGI (Gunicorn/uWSGI)

## Executar Localmente

```bash
cd D:\Gestão Financeira
python app.py
```

Aceder: http://localhost:5000

## Estrutura

- `app.py` - Aplicação Flask principal
- `db.py` - Base de dados e criptografia
- `reports.py` - Gráficos
- `templates/` - Interface web (Bootstrap 5 + Chart.js)
- `financial.db` - Base de dados SQLite (encriptada)
- `secret.key` - Chave de encriptação (NÃO PARTILHAR)

## Aviso Legal

Este sistema é para uso pessoal. Antes de publicar na internet:
- Certifique-se de ter HTTPS
- Faça backup regular da BD e chave
- Revise as configurações de segurança
