# -*- coding: utf-8 -*-
# Encoding: UTF-8 (suporte a caracteres especiais pt-BR)
from app import app

# Para Render.com (usa raiz /)
application = app

# Para teste local (opcional)
if __name__ == "__main__":
    app.run()
