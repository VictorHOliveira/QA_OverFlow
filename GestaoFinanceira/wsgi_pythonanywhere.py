# -*- coding: utf-8 -*-
# Encoding: UTF-8 (suporte a caracteres especiais pt-BR)
import sys
import os

# Caminho para a pasta do projeto no PythonAnywhere
# Altere 'seuusername' para o seu username no PythonAnywhere
caminho_projeto = '/home/seuusername/GestaoFinanceira'
if caminho_projeto not in sys.path:
    sys.path.append(caminho_projeto)

os.chdir(caminho_projeto)

# Carregar variáveis de ambiente (não esquecer do .env)
from dotenv import load_dotenv
load_dotenv()

# Importar a aplicação
from app import app as application

# Para teste local (opcional)
if __name__ == "__main__":
    app.run()
