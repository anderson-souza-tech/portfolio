import os
import psycopg2
from psycopg2.extras import RealDictCursor

DB_HOST = os.getenv("DB_HOST", "db")
DB_NAME = os.getenv("DB_NAME", "portfolio")
DB_USER = os.getenv("DB_USER", "portfolio_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "TROCAR_ANTES_DE_SUBIR")
DB_PORT = os.getenv("DB_PORT", "5432")


def get_connection():
    """Abre uma nova conexão com o PostgreSQL. Simples de propósito —
    para um projeto maior, trocar por um pool de conexões (ex: SQLAlchemy)."""
    return psycopg2.connect(
        host=DB_HOST,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        cursor_factory=RealDictCursor,
    )
