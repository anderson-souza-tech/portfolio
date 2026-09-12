<<<<<<< HEAD
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
- **Registry**: [Docker Hub](https://hub.docker.com/u/docker4linux26) (`docker4linux26/portfolio-backend`, `docker4linux26/portfolio-frontend`)
- **Repositório**: https://github.com/anderson-souza-tech/portfolio

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

Os manifests em `k8s/manifests/` já apontam para as imagens publicadas no
Docker Hub (`docker4linux26/portfolio-backend:1.0` e
`docker4linux26/portfolio-frontend:1.0`), com `imagePullPolicy: IfNotPresent`.

```bash
# 1. (Opcional) Build e push manual, sem depender do CI —
#    normalmente isso é feito pelo GitHub Actions a cada push na main
docker login
docker build -t docker4linux26/portfolio-backend:1.0 ./backend
docker build -t docker4linux26/portfolio-frontend:1.0 ./frontend
docker push docker4linux26/portfolio-backend:1.0
docker push docker4linux26/portfolio-frontend:1.0

# 2. Aplicar os manifests
kubectl apply -f k8s/manifests/

# 3. Acompanhar os pods
kubectl get pods -n portfolio -w
```

> Para testar mudanças locais sem publicar no registry a cada vez, buildar
> as imagens localmente com a mesma tag (`docker build -t
> docker4linux26/portfolio-backend:1.0 ./backend`) e trocar
> `imagePullPolicy` para `Never` nos manifests — assim o Kubernetes usa a
> imagem já existente no daemon local em vez de tentar puxar do Docker Hub.

Para acessar via navegador, adicione `127.0.0.1 anderson.nsconsultoria.cloud` ao
arquivo `hosts` do Windows e acesse `http://anderson.nsconsultoria.cloud` (ou
teste via `curl -H "Host: anderson.nsconsultoria.cloud" http://localhost/`).

## Recursos de Kubernetes usados (propositalmente, como demonstração)

- **Namespace** dedicado
- **Secret** para credenciais do banco
- **PersistentVolumeClaim** para dados do PostgreSQL
- **Deployments** com liveness/readiness probes em todos os serviços
- **HorizontalPodAutoscaler** no backend (escala por uso de CPU — requer
  `metrics-server` no cluster para funcionar de verdade)
- **Ingress** com proxy interno para a API via Nginx

## Publicando de verdade

- [ ] Trocar as credenciais placeholder (`TROCAR_ANTES_DE_SUBIR`) por segredos reais
- [x] Definir um registry de destino — Docker Hub (`docker4linux26`)
- [ ] Configurar `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` nos Secrets do
      repositório GitHub (Settings > Secrets and variables > Actions) para
      o CI conseguir publicar as imagens automaticamente
- [ ] Configurar TLS no Ingress (cert-manager ou certificado manual)
- [ ] Preencher o conteúdo real (seção "Sobre", skills, projetos) — hoje
      tem dados de exemplo no `db-init/01-init.sql`
- [ ] Instalar `metrics-server` no cluster se quiser o HPA funcionando de fato
- [x] Completar o workflow de CI com push para o registry escolhido
=======
# DevSystem — pacote de deploy

Portfólio estático de Anderson Souza servido pelo Nginx em um container Docker.

## Estrutura

```text
devsystem-container/
├── site/
│   ├── assets/
│   │   ├── anderson-souza.jpeg
│   │   └── favicon.svg
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── nginx/
│   └── default.conf
├── deploy/
│   └── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       └── pipeline.yml
├── .dockerignore
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── docker-stack.yml
└── README.md
```

## Opção 1 — executar diretamente com Docker

Na raiz do projeto:

```bash
docker build -t devsystem-portfolio:latest .
docker run -d \
  --name devsystem-portfolio \
  --restart unless-stopped \
  -p 8080:80 \
  devsystem-portfolio:latest
```

Acesse `http://IP-DO-SERVIDOR:8080`.

Validar o container:

```bash
docker ps
docker logs devsystem-portfolio
curl http://127.0.0.1:8080/health
```

## Opção 2 — Docker Compose

Crie o arquivo de configuração local:

```bash
cp .env.example .env
```

Edite a porta em `.env`, se necessário, e execute:

```bash
docker compose up -d --build
docker compose ps
```

Para atualizar o site depois de alterar os arquivos da pasta `site/`:

```bash
docker compose up -d --build --force-recreate
```

Para remover o ambiente:

```bash
docker compose down
```

## Opção 3 — Docker Swarm com Traefik

O arquivo `docker-stack.yml` considera que o Traefik já está implantado, possui o entrypoint `websecure`, utiliza o resolvedor de certificados `letsencrypt` e está conectado à rede overlay `traefik-public`.

Crie a rede uma única vez, caso ainda não exista:

```bash
docker network create --driver overlay --attachable traefik-public
```

Publique a imagem em um registry acessível por todos os nós:

```bash
docker login
docker build -t seu-usuario/devsystem-portfolio:latest .
docker push seu-usuario/devsystem-portfolio:latest
```

Defina as variáveis e faça o deploy:

```bash
export IMAGE_NAME=seu-usuario/devsystem-portfolio:latest
export DOMAIN=devsystem.seudominio.com.br
docker stack deploy -c docker-stack.yml devsystem
```

Confira a implantação:

```bash
docker stack services devsystem
docker stack ps devsystem --no-trunc
docker service logs -f devsystem_devsystem
```

Atualização após publicar uma nova tag:

```bash
docker service update \
  --image seu-usuario/devsystem-portfolio:NOVA-TAG \
  --with-registry-auth \
  devsystem_devsystem
```

Remover a stack:

```bash
docker stack rm devsystem
```

## Publicar no GitHub

Depois de extrair o pacote na pasta do repositório:

```bash
git init
git add .
git commit -m "Publica portfólio DevSystem"
git branch -M main
git remote add origin https://github.com/anderson-souza-tech/portfolio.git
git push -u origin main
```

Se o repositório já estiver inicializado, não execute novamente `git init` nem `git remote add origin`; apenas adicione, confirme e envie as alterações.

## Onde editar o conteúdo

- Texto e links: `site/index.html`
- Estilos e responsividade: `site/styles.css`
- Menu e animações: `site/app.js`
- Foto e favicon: `site/assets/`
- Configuração do Nginx: `nginx/default.conf`

## Pipeline GitHub Actions

A pipeline em `.github/workflows/pipeline.yml` executa automaticamente:

1. Validação dos arquivos essenciais.
2. Build e teste de saúde do container.
3. Publicação das tags `latest` e do commit no GitHub Container Registry.
4. Conexão SSH com o servidor.
5. Atualização do ambiente usando Docker Compose.
6. Verificação do endpoint `/health` depois do deploy.

Pull requests executam somente a validação. Pushes na branch `main` publicam a imagem e fazem o deploy. A pipeline também pode ser iniciada manualmente em **Actions > DevSystem CI/CD > Run workflow**.

### Secrets obrigatórios

Cadastre em **Settings > Secrets and variables > Actions > Secrets**:

| Secret | Conteúdo |
|---|---|
| `DEPLOY_HOST` | IP ou nome DNS do servidor |
| `DEPLOY_USER` | Usuário SSH com acesso ao Docker |
| `DEPLOY_SSH_KEY` | Chave SSH privada completa |
| `DEPLOY_KNOWN_HOSTS` | Chave pública de identificação do servidor SSH |
| `GHCR_USERNAME` | Usuário do GitHub que acessará o pacote |
| `GHCR_READ_TOKEN` | Personal Access Token com permissão `read:packages` |

Para gerar o conteúdo de `DEPLOY_KNOWN_HOSTS`, execute em uma máquina confiável e confira a impressão digital antes de cadastrar:

```bash
ssh-keyscan -H IP-OU-DOMINIO-DO-SERVIDOR
```

### Variables opcionais

Cadastre em **Settings > Secrets and variables > Actions > Variables** somente se desejar alterar os padrões:

| Variable | Padrão | Finalidade |
|---|---:|---|
| `DEPLOY_PORT` | `22` | Porta do SSH |
| `DEPLOY_PATH` | `/opt/devsystem` | Diretório da aplicação no servidor |
| `HTTP_PORT` | `8080` | Porta publicada pelo container |

### Preparação do servidor

O servidor precisa ter Docker, o plugin Docker Compose e o usuário SSH deve conseguir executar `docker` sem interação. Exemplo para criar o diretório padrão:

```bash
sudo mkdir -p /opt/devsystem
sudo chown -R SEU_USUARIO:SEU_USUARIO /opt/devsystem
docker --version
docker compose version
```

No repositório do GitHub, mantenha a permissão de workflow para publicar pacotes. A pipeline já declara `packages: write` e utiliza o `GITHUB_TOKEN` fornecido pelo próprio GitHub para enviar a imagem ao GHCR.
>>>>>>> d76ab46 (feat: adiciona portfolio DevSystem com Docker e pipeline)
