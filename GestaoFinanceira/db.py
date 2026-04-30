import sqlite3
import os
import bcrypt
from cryptography.fernet import Fernet
from datetime import datetime
import base64

DB_NAME = "financial.db"
KEY_FILE = "secret.key"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password_hash TEXT NOT NULL,
                  created_at TEXT NOT NULL)''')
    c.execute('''CREATE TABLE IF NOT EXISTS expenses
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  category TEXT NOT NULL,
                  encrypted_amount TEXT NOT NULL,
                  encrypted_description TEXT NOT NULL,
                  expense_date TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS income
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  category TEXT NOT NULL,
                  encrypted_amount TEXT NOT NULL,
                  encrypted_description TEXT NOT NULL,
                  income_date TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    conn.commit()
    conn.close()

def get_db_connection():
    return sqlite3.connect(DB_NAME)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except:
        return False

def load_encryption_key():
    if not os.path.exists(KEY_FILE):
        key = Fernet.generate_key()
        with open(KEY_FILE, 'wb') as f:
            f.write(key)
        print(f"AVISO: Chave de encriptação gerada em {KEY_FILE}")
        print("GUARDE ESTE FICHEIRO NUM LOCAL SEGURO. SEM ELE NÃO CONSEGUIRÁ DESENCRIPTAR OS DADOS.")
    with open(KEY_FILE, 'rb') as f:
        return Fernet(f.read())

_fernet = None
def get_fernet():
    global _fernet
    if _fernet is None:
        _fernet = load_encryption_key()
    return _fernet

def encrypt_data(data: str) -> str:
    return base64.b64encode(get_fernet().encrypt(data.encode('utf-8'))).decode('utf-8')

def decrypt_data(encrypted_data: str) -> str:
    return get_fernet().decrypt(base64.b64decode(encrypted_data)).decode('utf-8')

def add_expense(user_id: int, category: str, amount: float, description: str, expense_date: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''INSERT INTO expenses (user_id, category, encrypted_amount, encrypted_description, expense_date, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)''',
              (user_id, category, encrypt_data(f"{amount:.2f}"), encrypt_data(description), expense_date, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def get_user_expenses(user_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''SELECT id, category, encrypted_amount, encrypted_description, expense_date
                 FROM expenses WHERE user_id = ? ORDER BY expense_date DESC''', (user_id,))
    rows = c.fetchall()
    conn.close()
    return [{
        'id': r[0],
        'category': r[1],
        'amount': float(decrypt_data(r[2])),
        'description': decrypt_data(r[3]),
        'date': r[4]
    } for r in rows]

def get_spending_by_category(user_id: int, start_date: str = None, end_date: str = None):
    conn = get_db_connection()
    c = conn.cursor()
    query = '''SELECT category, encrypted_amount FROM expenses WHERE user_id = ?'''
    params = [user_id]
    if start_date:
        query += ' AND expense_date >= ?'; params.append(start_date)
    if end_date:
        query += ' AND expense_date <= ?'; params.append(end_date)
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    totals = {}
    for cat, enc_amt in rows:
        totals[cat] = totals.get(cat, 0) + float(decrypt_data(enc_amt))
    return totals

def get_monthly_spending(user_id: int, year: int, month: int):
    start = f"{year}-{month:02d}-01"
    end = f"{year+1}-01-01" if month == 12 else f"{year}-{month+1:02d}-01"
    return get_spending_by_category(user_id, start, end)

# Funções para Rendimentos
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password_hash TEXT NOT NULL,
                  created_at TEXT NOT NULL)''')
    c.execute('''CREATE TABLE IF NOT EXISTS expenses
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  category TEXT NOT NULL,
                  encrypted_amount TEXT NOT NULL,
                  encrypted_description TEXT NOT NULL,
                  expense_date TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS income
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  category TEXT NOT NULL,
                  encrypted_amount TEXT NOT NULL,
                  encrypted_description TEXT NOT NULL,
                  income_date TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    conn.commit()
    conn.close()

def add_income(user_id: int, category: str, amount: float, description: str, income_date: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''INSERT INTO income (user_id, category, encrypted_amount, encrypted_description, income_date, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)''',
              (user_id, category, encrypt_data(f"{amount:.2f}"), encrypt_data(description), income_date, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def get_user_income(user_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''SELECT id, category, encrypted_amount, encrypted_description, income_date
                 FROM income WHERE user_id = ? ORDER BY income_date DESC''', (user_id,))
    rows = c.fetchall()
    conn.close()
    return [{
        'id': r[0],
        'category': r[1],
        'amount': float(decrypt_data(r[2])),
        'description': decrypt_data(r[3]),
        'date': r[4]
    } for r in rows]

def get_income_by_category(user_id: int, start_date: str = None, end_date: str = None):
    conn = get_db_connection()
    c = conn.cursor()
    query = '''SELECT category, encrypted_amount FROM income WHERE user_id = ?'''
    params = [user_id]
    if start_date:
        query += ' AND income_date >= ?'; params.append(start_date)
    if end_date:
        query += ' AND income_date <= ?'; params.append(end_date)
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    totals = {}
    for cat, enc_amt in rows:
        totals[cat] = totals.get(cat, 0) + float(decrypt_data(enc_amt))
    return totals

def get_monthly_income(user_id: int, year: int, month: int):
    start = f"{year}-{month:02d}-01"
    end = f"{year+1}-01-01" if month == 12 else f"{year}-{month+1:02d}-01"
    return get_income_by_category(user_id, start, end)

def get_expense_by_id(expense_id: int, user_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''SELECT id, category, encrypted_amount, encrypted_description, expense_date, user_id 
                 FROM expenses WHERE id = ? AND user_id = ?''', (expense_id, user_id))
    row = c.fetchone()
    conn.close()
    if row:
        return {
            'id': row[0],
            'category': row[1],
            'amount': float(decrypt_data(row[2])),
            'description': decrypt_data(row[3]),
            'date': row[4],
            'user_id': row[5]
        }
    return None

def update_expense(expense_id: int, user_id: int, category: str, amount: float, description: str, expense_date: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''UPDATE expenses 
                 SET category = ?, encrypted_amount = ?, encrypted_description = ?, expense_date = ?
                 WHERE id = ? AND user_id = ?''',
              (category, encrypt_data(f"{amount:.2f}"), encrypt_data(description), expense_date, expense_id, user_id))
    conn.commit()
    conn.close()

def get_income_by_id(income_id: int, user_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''SELECT id, category, encrypted_amount, encrypted_description, income_date, user_id 
                 FROM income WHERE id = ? AND user_id = ?''', (income_id, user_id))
    row = c.fetchone()
    conn.close()
    if row:
        return {
            'id': row[0],
            'category': row[1],
            'amount': float(decrypt_data(row[2])),
            'description': decrypt_data(row[3]),
            'date': row[4],
            'user_id': row[5]
        }
    return None

def update_income(income_id: int, user_id: int, category: str, amount: float, description: str, income_date: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''UPDATE income 
                 SET category = ?, encrypted_amount = ?, encrypted_description = ?, income_date = ?
                 WHERE id = ? AND user_id = ?''',
              (category, encrypt_data(f"{amount:.2f}"), encrypt_data(description), income_date, income_id, user_id))
    conn.commit()
    conn.close()

def delete_expense(expense_id: int, user_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''DELETE FROM expenses WHERE id = ? AND user_id = ?''', (expense_id, user_id))
    conn.commit()
    conn.close()

def delete_income(income_id: int, user_id: int):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''DELETE FROM income WHERE id = ? AND user_id = ?''', (income_id, user_id))
    conn.commit()
    conn.close()
