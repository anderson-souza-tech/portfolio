import os
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .database import get_connection

app = FastAPI(
    title="Portfolio API",
    description="API do meu portfólio pessoal — construído com Docker e Kubernetes "
                 "como demonstração técnica, não só como vitrine.",
    version="1.0.0",
)

# CORS liberado para o frontend (mesmo domínio via Ingress em produção,
# mas útil para testes locais com frontend/backend em portas diferentes).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# =========================================================
# Saúde do serviço — usado pelos probes do Kubernetes
# =========================================================
@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# =========================================================
# Arquitetura — o "meta" do projeto: o site descreve a própria stack
# =========================================================
@app.get("/api/architecture")
def architecture():
    return {
        "descricao": "Este portfólio é, ele mesmo, a demonstração técnica: "
                      "frontend estático + API + banco, orquestrados em Kubernetes.",
        "componentes": [
            {"nome": "frontend", "tecnologia": "HTML/CSS/JS + Nginx", "papel": "serve os arquivos estáticos e faz proxy reverso para /api"},
            {"nome": "backend", "tecnologia": "Python 3.12 + FastAPI", "papel": "API REST, documentação automática em /docs"},
            {"nome": "db", "tecnologia": "PostgreSQL 16", "papel": "persistência de projetos, skills e guestbook"},
        ],
        "kubernetes": [
            "Namespace dedicado",
            "Secret para credenciais do banco",
            "PersistentVolumeClaim para dados do PostgreSQL",
            "Deployments com liveness/readiness probes",
            "HorizontalPodAutoscaler no backend (escala por uso de CPU)",
            "Ingress com roteamento por path (/ para o frontend, /api para o backend)",
        ],
        "repositorio": "ajustar com o link do GitHub após publicar",
    }


# =========================================================
# Skills
# =========================================================
@app.get("/api/skills")
def list_skills():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT categoria, nome, nivel FROM skills ORDER BY categoria, nome")
            return cur.fetchall()
    finally:
        conn.close()


# =========================================================
# Projetos
# =========================================================
@app.get("/api/projects")
def list_projects():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, titulo, descricao, tecnologias, link FROM projetos ORDER BY id DESC")
            return cur.fetchall()
    finally:
        conn.close()


# =========================================================
# Guestbook — visitantes deixam uma mensagem
# =========================================================
class MensagemEntrada(BaseModel):
    nome: str = Field(..., min_length=1, max_length=80)
    mensagem: str = Field(..., min_length=1, max_length=500)


@app.get("/api/guestbook")
def list_guestbook():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT nome, mensagem, criado_em FROM guestbook ORDER BY criado_em DESC LIMIT 50"
            )
            return cur.fetchall()
    finally:
        conn.close()


@app.post("/api/guestbook", status_code=201)
def add_guestbook(entrada: MensagemEntrada):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO guestbook (nome, mensagem) VALUES (%s, %s) RETURNING id, criado_em",
                (entrada.nome, entrada.mensagem),
            )
            novo = cur.fetchone()
            conn.commit()
            return novo
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
