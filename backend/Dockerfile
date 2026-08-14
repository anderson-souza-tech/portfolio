# =========================================================
# Backend — API do portfólio (FastAPI)
# Base moderna, sem os problemas de EOL enfrentados no projeto VEANET —
# lição aprendida ali aplicada aqui: escolher uma base com suporte ativo.
# =========================================================
FROM python:3.12-slim

WORKDIR /app

# Instala dependências primeiro (camada cacheável — só reconstrói se
# requirements.txt mudar, não a cada alteração de código).
COPY requirements.txt .
RUN pip install --no-cache-dir --break-system-packages -r requirements.txt

# Código da aplicação
COPY app/ ./app/

# Usuário não-root — boa prática de segurança que não foi possível aplicar
# no ambiente PHP legado do VEANET (mod_php roda como o usuário do Apache),
# mas aqui, com uma base moderna, não há motivo para não fazer.
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
