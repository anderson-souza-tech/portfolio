# Portfólio Pessoal — Anderson Santos de Souza

Site pessoal construído como demonstração técnica: não é só uma vitrine
*sobre* Docker/Kubernetes, é *feito com* Docker e Kubernetes, de ponta a
ponta. O próprio site tem uma aba "Arquitetura" que explica como ele
funciona, alimentada por um endpoint da própria API (`/api/architecture`).

## Stack

- **Frontend**: HTML/CSS/JS estático, servido por Nginx (que também faz
  proxy reverso para a API em `/api`)
- **Backend**: Python 3.12 + FastAPI (documentação automática em `/docs`)
- **Banco**: PostgreSQL 16
- **Orquestração**: Docker Compose (local) e Kubernetes (produção)

## Estrutura

```
portfolio/
├── README.md
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/ (index.html, style.css, script.js)
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/ (main.py, database.py)
├── db-init/
│   └── 01-init.sql
├── k8s/manifests/       (namespace, secret, db, backend + HPA, frontend, ingress)
└── .github/workflows/   (CI de build das imagens)
```

## Rodando localmente (Docker Compose)

```bash
docker compose up -d
```

Acesse **http://localhost:8080**. A documentação interativa da API fica em
**http://localhost:8080/docs**.

## Rodando em Kubernetes (Docker Desktop)

```bash
# 1. Buildar as imagens localmente (Docker Desktop compartilha o daemon
#    com o Kubernetes embutido, então não precisa de push para testar)
docker build -t portfolio-frontend:latest ./frontend
docker build -t portfolio-backend:latest ./backend

# 2. Aplicar os manifests
kubectl apply -f k8s/manifests/

# 3. Acompanhar os pods
kubectl get pods -n portfolio -w
```

Para acessar via navegador, adicione `127.0.0.1 portfolio.local` ao arquivo
`hosts` do Windows e acesse `http://portfolio.local` (ou teste via
`curl -H "Host: portfolio.local" http://localhost/`).

## Recursos de Kubernetes usados (propositalmente, como demonstração)

- **Namespace** dedicado
- **Secret** para credenciais do banco
- **PersistentVolumeClaim** para dados do PostgreSQL
- **Deployments** com liveness/readiness probes em todos os serviços
- **HorizontalPodAutoscaler** no backend (escala por uso de CPU — requer
  `metrics-server` no cluster para funcionar de verdade)
- **Ingress** com proxy interno para a API via Nginx

## Publicando de verdade

Antes de publicar (homelab ou nuvem), ajustar:

- [ ] Trocar as credenciais placeholder (`TROCAR_ANTES_DE_SUBIR`) por segredos reais
- [ ] Definir um registry de destino (Docker Hub, GHCR) e ajustar `imagePullPolicy`
- [ ] Configurar TLS no Ingress (cert-manager ou certificado manual)
- [ ] Trocar o domínio placeholder (`portfolio.local`) pelo domínio real
- [ ] Preencher o conteúdo real (seção "Sobre", skills, projetos) — hoje
      tem dados de exemplo no `db-init/01-init.sql`
- [ ] Instalar `metrics-server` no cluster se quiser o HPA funcionando de fato
- [ ] Completar o workflow de CI com push para o registry escolhido
