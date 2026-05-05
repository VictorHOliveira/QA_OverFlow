# -*- coding: utf-8 -*-
# Encoding: UTF-8 (suporte a caracteres especiais pt-BR)
from flask import Flask, render_template, request, redirect, url_for, session, flash, abort
from flask_wtf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from db import init_db, hash_password, verify_password, add_expense, get_user_expenses, get_spending_by_category, get_monthly_spending, get_db_connection, add_income, get_user_income, get_income_by_category, get_monthly_income, get_expense_by_id, update_expense, get_income_by_id, update_income, delete_expense, delete_income
from datetime import datetime
import sqlite3
import os
import secrets
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__, static_url_path='/admin/static')  # Ajustar para servir static files sob /admin

# Configurações de Segurança
app.config.update(
    SECRET_KEY=os.environ.get('FLASK_SECRET_KEY', secrets.token_hex(32)),
    WTF_CSRF_ENABLED=True,
    WTF_CSRF_TIME_LIMIT=None,
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=3600  # 1 hora
)

# Proteção CSRF
csrf = CSRFProtect(app)

# Rate Limiting (proteção contra força bruta)
# Usar memória para simplicidade local, para produção usar Redis ou similar
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"  # Para produção: redis://localhost:6379/0
)

init_db()

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

INCOME_CATEGORIES = [
    "Ordenado",
    "Trabalho Extra",
    "Investimentos (Dividendos/Juros)",
    "Vendas",
    "Rendas Recebidas",
    "Outros Rendimentos"
]

@app.route("/")
def index():
    if "user_id" not in session:
        return redirect(url_for("login"))
    return redirect(url_for("dashboard"))

@app.route("/login", methods=["GET", "POST"])
@limiter.limit("5 per minute")  # Máximo 5 tentativas por minuto
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT id, password_hash FROM users WHERE username = ?", (username,))
        user = c.fetchone()
        conn.close()
        if user and verify_password(password, user[1]):
            session["user_id"] = user[0]
            session.permanent = True  # Sessão com tempo limitado
            flash("Login efetuado com sucesso!", "success")
            return redirect(url_for("dashboard"))
        flash("Credenciais inválidas", "danger")
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
@limiter.limit("3 per hour")  # Máximo 3 registos por hora por IP
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        if not username or not password:
            flash("Todos os campos são obrigatórios", "danger")
            return render_template("register.html")
        if len(password) < 8:
            flash("Password deve ter pelo menos 8 caracteres", "danger")
            return render_template("register.html")
        conn = get_db_connection()
        c = conn.cursor()
        try:
            c.execute("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
                      (username, hash_password(password), datetime.now().isoformat()))
            conn.commit()
            flash("Registo concluído! Faça login.", "success")
            return redirect(url_for("login"))
        except sqlite3.IntegrityError:
            flash("Username já existe", "danger")
        finally:
            conn.close()
    return render_template("register.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("login"))
    user_id = session["user_id"]
    expenses = get_user_expenses(user_id)[:5]
    income = get_user_income(user_id)[:5]
    now = datetime.now()
    monthly_spending = get_monthly_spending(user_id, now.year, now.month)
    monthly_income = get_monthly_income(user_id, now.year, now.month)
    total_expenses = sum(monthly_spending.values())
    total_income = sum(monthly_income.values())
    balance = total_income - total_expenses
    return render_template("dashboard.html", expenses=expenses, income=income,
                           total_expenses=total_expenses, total_income=total_income, balance=balance)

# Verificação automática de sessão para todas as rotas protegidas
@app.before_request
def check_session():
    allowed_routes = ['login', 'register', 'static']
    if request.endpoint and request.endpoint not in allowed_routes:
        if "user_id" not in session:
            return redirect(url_for("login"))

@app.route("/add-expense", methods=["GET", "POST"])
def add_expense_route():
    if "user_id" not in session:
        return redirect(url_for("login"))
    if request.method == "POST":
        user_id = session["user_id"]
        category = request.form["category"]
        amount = float(request.form["amount"])
        description = request.form["description"]
        expense_date = request.form.get("expense_date", datetime.now().strftime("%Y-%m-%d"))
        add_expense(user_id, category, amount, description, expense_date)
        flash("Despesa adicionada!", "success")
        return redirect(url_for("dashboard"))
    return render_template("add_expense.html", categories=CATEGORIES, now=datetime.now())

@app.route("/expenses")
def expenses():
    if "user_id" not in session:
        return redirect(url_for("login"))
    expenses = get_user_expenses(session["user_id"])
    return render_template("expenses.html", expenses=expenses)

@app.route("/add-income", methods=["GET", "POST"])
def add_income_route():
    if "user_id" not in session:
        return redirect(url_for("login"))
    if request.method == "POST":
        user_id = session["user_id"]
        category = request.form["category"]
        amount = float(request.form["amount"])
        description = request.form["description"]
        income_date = request.form.get("income_date", datetime.now().strftime("%Y-%m-%d"))
        add_income(user_id, category, amount, description, income_date)
        flash("Rendimento adicionado!", "success")
        return redirect(url_for("dashboard"))
    return render_template("add_income.html", categories=INCOME_CATEGORIES, now=datetime.now())

@app.route("/income")
def income_list():
    if "user_id" not in session:
        return redirect(url_for("login"))
    income = get_user_income(session["user_id"])
    return render_template("income.html", income=income)

@app.route("/edit-expense/<int:expense_id>", methods=["GET", "POST"])
def edit_expense(expense_id):
    if "user_id" not in session:
        return redirect(url_for("login"))
    user_id = session["user_id"]
    expense = get_expense_by_id(expense_id, user_id)
    if not expense:
        flash("Despesa não encontrada", "danger")
        return redirect(url_for("expenses"))
    if request.method == "POST":
        category = request.form["category"]
        amount = float(request.form["amount"])
        description = request.form["description"]
        expense_date = request.form["expense_date"]
        update_expense(expense_id, user_id, category, amount, description, expense_date)
        flash("Despesa atualizada!", "success")
        return redirect(url_for("expenses"))
    return render_template("edit_expense.html", expense=expense, categories=CATEGORIES)

@app.route("/edit-income/<int:income_id>", methods=["GET", "POST"])
def edit_income(income_id):
    if "user_id" not in session:
        return redirect(url_for("login"))
    user_id = session["user_id"]
    income = get_income_by_id(income_id, user_id)
    if not income:
        flash("Rendimento não encontrado", "danger")
        return redirect(url_for("income_list"))
    if request.method == "POST":
        category = request.form["category"]
        amount = float(request.form["amount"])
        description = request.form["description"]
        income_date = request.form["income_date"]
        update_income(income_id, user_id, category, amount, description, income_date)
        flash("Rendimento atualizado!", "success")
        return redirect(url_for("income_list"))
    return render_template("edit_income.html", income=income, categories=INCOME_CATEGORIES)

@app.route("/delete-expense/<int:expense_id>")
def delete_expense_route(expense_id):
    if "user_id" not in session:
        return redirect(url_for("login"))
    user_id = session["user_id"]
    delete_expense(expense_id, user_id)
    flash("Despesa eliminada!", "success")
    return redirect(url_for("expenses"))

@app.route("/delete-income/<int:income_id>")
def delete_income_route(income_id):
    if "user_id" not in session:
        return redirect(url_for("login"))
    user_id = session["user_id"]
    delete_income(income_id, user_id)
    flash("Rendimento eliminado!", "success")
    return redirect(url_for("income_list"))

@app.route("/reports")
def reports():
    if "user_id" not in session:
        return redirect(url_for("login"))
    user_id = session["user_id"]
    cat_spending = get_spending_by_category(user_id)
    cat_labels = list(cat_spending.keys())
    cat_data = list(cat_spending.values())
    now = datetime.now()
    months = []
    month_expense_data = []
    month_income_data = []
    for i in range(6):
        m = now.month - i
        y = now.year
        if m <= 0:
            m += 12
            y -= 1
        month_expense_data.append(sum(get_monthly_spending(user_id, y, m).values()))
        month_income_data.append(sum(get_monthly_income(user_id, y, m).values()))
        months.append(f"{y}-{m:02d}")
    months.reverse()
    month_expense_data.reverse()
    month_income_data.reverse()
    current_expenses = sum(get_monthly_spending(user_id, now.year, now.month).values())
    current_income = sum(get_monthly_income(user_id, now.year, now.month).values())
    balance = current_income - current_expenses
    tips = []
    if current_expenses > 0:
        top_cats = sorted(get_monthly_spending(user_id, now.year, now.month).items(), key=lambda x: x[1], reverse=True)[:3]
        for cat, amt in top_cats:
            tips.append({"category": cat, "amount": amt, "save_10": amt*0.1, "save_20": amt*0.2})
    return render_template("reports.html",
                           cat_labels=cat_labels, cat_data=cat_data,
                           month_labels=months, month_expense_data=month_expense_data, month_income_data=month_income_data,
                           tips=tips, current_expenses=current_expenses, current_income=current_income, balance=balance)

@app.route("/logout")
def logout():
    session.pop("user_id", None)
    flash("Logout efetuado", "info")
    return redirect(url_for("login"))

if __name__ == "__main__":
    app.run(debug=True)
