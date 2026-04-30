import os
import sys
import sqlite3
from datetime import datetime
from db import init_db, get_db_connection, hash_password, verify_password, add_expense, get_user_expenses, get_spending_by_category, get_monthly_spending
from reports import generate_pie_chart, generate_monthly_bar_chart, get_savings_tips

CATEGORIES = [
    "Moradia (Aluguer/Hipoteca)",
    "Alimentação (Supermercado/Restaurantes)",
    "Transporte (Combustível/Transportes Públicos)",
    "Contas (Água/Eletricidade/Gás/Internet)",
    "Saúde (Médico/Farmácia)",
    "Educação (Propinas/Cursos)",
    "Lazer (Cinema/Viagens/Hobbies)",
    "Compras (Roupa/Eletrónicos)",
    "Outros"
]

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def register_user():
    clear_screen()
    print("=== Registo ===")
    username = input("Username: ").strip()
    password = input("Password: ").strip()
    if not username or not password:
        print("Campos obrigatórios."); input("Enter..."); return None
    conn = get_db_connection()
    try:
        c = conn.cursor()
        c.execute('''INSERT INTO users (username, password_hash, created_at)
                     VALUES (?, ?, ?)''', (username, hash_password(password), datetime.now().isoformat()))
        conn.commit()
        print("Registo concluído!"); input("Enter...")
        return c.lastrowid
    except sqlite3.IntegrityError:
        print("Username já existe."); input("Enter..."); return None
    finally: conn.close()

def login_user():
    clear_screen()
    print("=== Login ===")
    username = input("Username: ").strip()
    password = input("Password: ").strip()
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''SELECT id, password_hash FROM users WHERE username = ?''', (username,))
    row = c.fetchone()
    conn.close()
    if row and verify_password(password, row[1]):
        print("Login sucesso!"); input("Enter..."); return row[0]
    print("Credenciais inválidas."); input("Enter..."); return None

def add_expense_menu(user_id):
    clear_screen()
    print("=== Nova Despesa ===")
    for i, cat in enumerate(CATEGORIES, 1): print(f"{i}. {cat}")
    try:
        cat_idx = int(input(f"Categoria (1-{len(CATEGORIES)}): ")) -1
        category = CATEGORIES[cat_idx]
        amount = float(input("Montante (€): "))
        desc = input("Descrição: ").strip()
        date = input("Data (AAAA-MM-DD, Enter para hoje): ").strip() or datetime.now().strftime("%Y-%m-%d")
        add_expense(user_id, category, amount, desc, date)
        print("Despesa adicionada!"); input("Enter...")
    except: print("Entrada inválida."); input("Enter...")

def view_expenses_menu(user_id):
    clear_screen()
    print("=== Despesas ===")
    expenses = get_user_expenses(user_id)
    if not expenses: print("Nenhuma despesa."); input("Enter..."); return
    for e in expenses:
        print(f"{e['date']} | {e['category'][:20]} | {e['description'][:20]} | {e['amount']:.2f} €")
    input("Enter...")

def reports_menu(user_id):
    clear_screen()
    print("=== Relatórios ===")
    print("1. Gráfico por Categoria")
    print("2. Gráfico Mensal")
    print("3. Dicas de Economia")
    print("4. Voltar")
    choice = input("Opção: ").strip()
    if choice == "1": generate_pie_chart(get_spending_by_category(user_id))
    elif choice == "2": generate_monthly_bar_chart(get_monthly_spending, user_id)
    elif choice == "3":
        get_savings_tips(get_monthly_spending, user_id)
        input("Enter...")

def main_menu(user_id):
    while True:
        clear_screen()
        print("=== Menu Principal (€) ===")
        print("1. Adicionar Despesa")
        print("2. Ver Despesas")
        print("3. Relatórios")
        print("4. Logout")
        choice = input("Opção: ").strip()
        if choice == "1": add_expense_menu(user_id)
        elif choice == "2": view_expenses_menu(user_id)
        elif choice == "3": reports_menu(user_id)
        elif choice == "4": break
        else: print("Inválido"); input("Enter...")

def main():
    init_db()
    while True:
        clear_screen()
        print("=== Gestão Financeira Local ===")
        print("1. Login")
        print("2. Registo")
        print("3. Sair")
        choice = input("Opção: ").strip()
        if choice == "1":
            uid = login_user()
            if uid: main_menu(uid)
        elif choice == "2":
            uid = register_user()
            if uid: main_menu(uid)
        elif choice == "3": sys.exit(0)
        else: print("Inválido"); input("Enter...")

if __name__ == "__main__":
    main()
