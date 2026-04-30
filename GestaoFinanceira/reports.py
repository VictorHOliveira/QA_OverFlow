import matplotlib.pyplot as plt
from datetime import datetime
import numpy as np

def generate_pie_chart(spending_by_category: dict):
    if not spending_by_category:
        print("Sem dados para gráfico."); return
    plt.figure(figsize=(10,6))
    plt.pie(spending_by_category.values(), labels=spending_by_category.keys(),
            autopct=lambda p: f'{p:.1f}% ({p*sum(spending_by_category.values())/100:.2f} €)', startangle=90)
    plt.title("Gastos por Categoria")
    plt.axis('equal')
    plt.savefig('spending_by_category.png')
    plt.show()
    print("Gráfico guardado: spending_by_category.png")

def generate_monthly_bar_chart(get_monthly_spending, user_id):
    now = datetime.now()
    months, totals = [], []
    for i in range(6):
        m = now.month - i; y = now.year
        if m <= 0: m +=12; y -=1
        total = sum(get_monthly_spending(user_id, y, m).values())
        months.append(f"{y}-{m:02d}"); totals.append(total)
    months.reverse(); totals.reverse()
    plt.figure(figsize=(10,6))
    plt.bar(months, totals, color='skyblue')
    plt.title("Gastos Mensais (Últimos 6 Meses)")
    plt.xlabel("Mês"); plt.ylabel("Total (€)")
    plt.xticks(rotation=45); plt.tight_layout()
    plt.savefig('monthly_spending.png')
    plt.show()
    print("Gráfico guardado: monthly_spending.png")

def get_savings_tips(get_monthly_spending, user_id):
    now = datetime.now()
    current = sum(get_monthly_spending(user_id, now.year, now.month).values())
    if current == 0: print("Sem gastos este mês."); return
    cats = sorted(get_monthly_spending(user_id, now.year, now.month).items(), key=lambda x: x[1], reverse=True)[:3]
    print(f"\nDicas de Economia (Total este mês: {current:.2f} €)")
    print("-"*50)
    for cat, amt in cats:
        print(f"{cat}: {amt:.2f} €")
        print(f"  Reduzir 10%: Poupar {amt*0.1:.2f} €/mês")
        print(f"  Reduzir 20%: Poupar {amt*0.2:.2f} €/mês")
        print("-"*50)
