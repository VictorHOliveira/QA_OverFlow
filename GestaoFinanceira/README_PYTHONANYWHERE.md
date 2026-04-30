# Deploy no PythonAnywhere

## 1. Criar Conta
1. Registe-se em [pythonanywhere.com](https://www.pythonanywhere.com)
2. Confirme o email

## 2. Upload dos Ficheiros
1. No Dashboard, vá em **"Files"**
2. Clique em **"Upload a file"** e envie:
   - Todos os ficheiros de `GestaoFinanceira/` (app.py, db.py, etc.)
   - Pasta `templates/`
3. Ou use o **Bash console** e faça git clone:
   ```bash
   git clone https://github.com/VictorHOliveira/QA_OverFlow.git
   ```

## 3. Configurar Virtualenv
No **Bash console**:
```bash
cd GestaoFinanceira
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 4. Configurar Web App
1. Vá em **"Web"** no Dashboard
2. Clique em **"Add a new web app"**
3. Selecione **"Flask"** e **Python 3.13**
4. No campo **"Source code"**: `/home/seuusername/GestaoFinanceira`
5. No campo **"Working directory"**: `/home/seuusername/GestaoFinanceira`
6. No campo **"WSGI configuration file"**: Clique em **"Edit"** e substitua por:

```python
import sys
import os

# Caminho para o projeto
path = '/home/seuusername/GestaoFinanceira'
if path not in sys.path:
    sys.path.insert(0, path)

os.chdir(path)

# Carregar .env
from dotenv import load_dotenv
load_dotenv()

# Importar app
from app import app as application
```

7. Clique em **"Save"**

## 5. Configurar Variáveis de Ambiente
Ainda no **"Web"** tab, vá em **"Environment variables"**:
- `FLASK_SECRET_KEY` = `3795274b46d4b5471ea25c66c8f84e27f7e120a6ce8202528a84de8804cab7c3`
- `FLASK_DEBUG` = `False`

## 6. Configurar Domínio Personalizado
1. No **"Web"** tab, vá em **"Domains"**
2. Adicione: `finance.qaoverflow.com`
3. PythonAnywhere dará instruções para o DNS

## 7. Configurar DNS (no provedor de qaoverflow.com)
Adicione um registro CNAME:
| Tipo | Nome/Host | Valor/Destino | TTL |
|------|----------------|---------------------|-----|
| CNAME | `finance` | `seuusername.pythonanywhere.com` | Automático |

## 8. Testar
1. Recarregue a web app no PythonAnywhere
2. Aceda a `https://finance.qaoverflow.com`
3. Registe um utilizador e teste o sistema
