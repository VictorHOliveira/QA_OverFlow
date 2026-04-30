import sqlite3
import json
import os
import base64
from datetime import datetime
from cryptography.fernet import Fernet
import subprocess

# Caminho da BD
DB_PATH = "financial.db"
BACKUP_DIR = "backups"
KEY_FILE = "secret.key"

def load_key():
    with open(KEY_FILE, 'rb') as f:
        return Fernet(f.read())

def backup_database():
    if not os.path.exists(DB_PATH):
        print("Base de dados não encontrada.")
        return False
    
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    # Ler dados da BD
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Ler tabela users (sem passwords)
    c.execute("SELECT id, username, created_at FROM users")
    users = [{"id": r[0], "username": r[1], "created_at": r[2]} for r in c.fetchall()]
    
    # Ler despesas (com desencriptação)
    c.execute("SELECT id, user_id, category, encrypted_amount, encrypted_description, expense_date, created_at FROM expenses")
    expenses = []
    fernet = load_key()
    for r in c.fetchall():
        expenses.append({
            "id": r[0],
            "user_id": r[1],
            "category": r[2],
            "amount": float(fernet.decrypt(base64.b64decode(r[3])).decode('utf-8')),
            "description": fernet.decrypt(base64.b64decode(r[4])).decode('utf-8'),
            "expense_date": r[5],
            "created_at": r[6]
        })
    
    # Ler rendimentos (com desencriptação)
    c.execute("SELECT id, user_id, category, encrypted_amount, encrypted_description, income_date, created_at FROM income")
    income = []
    for r in c.fetchall():
        income.append({
            "id": r[0],
            "user_id": r[1],
            "category": r[2],
            "amount": float(fernet.decrypt(base64.b64decode(r[3])).decode('utf-8')),
            "description": fernet.decrypt(base64.b64decode(r[4])).decode('utf-8'),
            "income_date": r[5],
            "created_at": r[6]
        })
    
    conn.close()
    
    # Criar ficheiro JSON
    backup_data = {
        "backup_date": datetime.now().isoformat(),
        "users": users,
        "expenses": expenses,
        "income": income
    }
    
    backup_file = os.path.join(BACKUP_DIR, f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
    
    print(f"Backup criado: {backup_file}")
    return backup_file

def git_commit_push(backup_file):
    try:
        # Configurar Git
        subprocess.run(["git", "config", "user.email", "backup@railway.app"], check=True)
        subprocess.run(["git", "config", "user.name", "Railway Backup"], check=True)
        
        # Adicionar ficheiro
        subprocess.run(["git", "add", backup_file], check=True)
        subprocess.run(["git", "add", BACKUP_DIR], check=True)
        
        # Commit
        commit_msg = f"Backup automático: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        subprocess.run(["git", "commit", "-m", commit_msg], check=True)
        
        # Push usando token se disponível
        token = os.environ.get('GITHUB_TOKEN')
        repo = os.environ.get('GITHUB_REPO', 'VictorHOliveira/QA_OverFlow')
        if token:
            push_url = f"https://{token}@github.com/{repo}.git"
            subprocess.run(["git", "push", push_url, "main"], check=True)
        else:
            subprocess.run(["git", "push", "origin", "main"], check=True)
        
        print("Backup enviado para GitHub!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erro no Git: {e}")
        return False

if __name__ == "__main__":
    backup_file = backup_database()
    if backup_file:
        git_commit_push(backup_file)
    else:
        print("Backup falhou.")
