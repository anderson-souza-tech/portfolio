#!/bin/bash
# =========================================================
# sync-k8s.sh — builda as imagens e força os pods do Kubernetes local
# (Docker Desktop) a recriarem com a versão mais recente.
#
# Uso:
#   ./sync-k8s.sh              # builda e sincroniza frontend + backend
#   ./sync-k8s.sh frontend     # só o frontend
#   ./sync-k8s.sh backend      # só o backend
# =========================================================
set -e

ALVO="${1:-all}"
NAMESPACE="portfolio"

echo "==> Buildando imagem(ns)..."
if [ "$ALVO" = "all" ]; then
    docker compose build frontend backend
elif [ "$ALVO" = "frontend" ] || [ "$ALVO" = "backend" ]; then
    docker compose build "$ALVO"
else
    echo "Uso: ./sync-k8s.sh [frontend|backend]  (sem argumento = ambos)"
    exit 1
fi

echo ""
echo "==> Reiniciando pods no Kubernetes (namespace: $NAMESPACE)..."
if [ "$ALVO" = "all" ]; then
    kubectl rollout restart deployment portfolio-frontend portfolio-backend -n "$NAMESPACE"
elif [ "$ALVO" = "frontend" ]; then
    kubectl rollout restart deployment portfolio-frontend -n "$NAMESPACE"
elif [ "$ALVO" = "backend" ]; then
    kubectl rollout restart deployment portfolio-backend -n "$NAMESPACE"
fi

echo ""
echo "==> Aguardando os pods ficarem prontos..."
if [ "$ALVO" = "all" ]; then
    kubectl rollout status deployment portfolio-frontend -n "$NAMESPACE"
    kubectl rollout status deployment portfolio-backend -n "$NAMESPACE"
else
    kubectl rollout status deployment "portfolio-$ALVO" -n "$NAMESPACE"
fi

echo ""
echo "✅ Sincronizado! Dê Ctrl+F5 em http://anderson.portfolio.com.br para ver as mudanças."
