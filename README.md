DevSystem Portfolio

Portfólio técnico de Anderson Souza, publicado em uma VPS Ubuntu com Docker, Nginx, Traefik, HTTPS automático e pipeline CI/CD pelo GitHub Actions.

Site: devsystem.tech

GitHub: anderson-souza-tech/portfolio

Status: em produção

Sobre o projeto

O DevSystem é um portfólio estático desenvolvido com HTML, CSS e JavaScript. O conteúdo é servido pelo Nginx dentro de um container Docker.

Quando uma alteração é aprovada e enviada para a branch main, o GitHub Actions valida o projeto, publica a imagem no GitHub Container Registry e atualiza automaticamente o container na VPS.

Arquitetura atual

Visitante
   | HTTPS
   v
Traefik na VPS
   | rede Docker proxy
   v
Container devsystem-portfolio
   |
   v
Nginx -> HTML, CSS, JavaScript e imagens

Camada

Tecnologia

Responsabilidade

Interface

HTML, CSS e JavaScript

Conteúdo, design, responsividade e animações

Servidor web

Nginx

Arquivos estáticos, cache, headers e health check

Empacotamento

Docker

Imagem reproduzível do site

Registry

GitHub Container Registry

Armazenamento das imagens publicadas

CI/CD

GitHub Actions

Validação, publicação e implantação

Proxy reverso

Traefik

Domínio, roteamento e HTTPS

Infraestrutura

VPS Ubuntu

Execução dos containers

Estrutura do repositório

portfolio/
├── .github/workflows/pipeline.yml
├── deploy/docker-compose.prod.yml
├── nginx/default.conf
├── site/
│   ├── assets/
│   │   ├── anderson-souza.jpeg
│   │   └── favicon.svg
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── backend/                 # arquitetura anterior/laboratório
├── db-init/                 # arquitetura anterior/laboratório
├── frontend/                # arquitetura anterior/laboratório
├── k8s/                     # laboratório Kubernetes
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docker-stack.yml
├── Dockerfile
└── README.md

Arquivos utilizados em produção

Arquivo

Finalidade

site/index.html

Estrutura, textos, links e seções da página

site/styles.css

Cores, layout, responsividade e animações

site/app.js

Menu móvel e exibição dos elementos durante a rolagem

site/assets/

Fotografia e favicon

nginx/default.conf

Configuração do Nginx, cache, segurança e /health

Dockerfile

Construção da imagem do site

deploy/docker-compose.prod.yml

Execução na VPS e integração com o Traefik

.github/workflows/pipeline.yml

Pipeline de CI/CD

Executar localmente com Docker

docker build -t devsystem-portfolio:local .
docker run --rm -d \
  --name devsystem-portfolio-local \
  -p 8080:80 \
  devsystem-portfolio:local

Acesse http://localhost:8080 e valide:

curl http://127.0.0.1:8080/health
docker logs devsystem-portfolio-local

Para encerrar:

docker stop devsystem-portfolio-local

Manutenção do conteúdo

Alteração

Arquivo principal

Textos, links ou seções

site/index.html

Cores, fontes e espaçamento

site/styles.css

Menu ou animações

site/app.js

Foto ou favicon

site/assets/

Cache, headers ou health check

nginx/default.conf

Domínio e regras do Traefik

deploy/docker-compose.prod.yml

Processo de CI/CD

.github/workflows/pipeline.yml

Fluxo recomendado para alterações

Atualize a branch principal e crie uma branch para a mudança:

git switch main
git pull --ff-only origin main
git switch -c feat/nome-da-alteracao

Depois de editar e testar:

git status
git diff
git add .
git commit -m "feat: descreva a alteração"
git push -u origin HEAD

Abra um pull request para a branch main. Pull requests executam somente a validação. Após o merge, a pipeline publica a imagem e atualiza a VPS automaticamente.

Pipeline CI/CD

O workflow .github/workflows/pipeline.yml possui três jobs.

Validar e testar container

confirma a existência dos arquivos essenciais;

constrói a imagem Docker;

inicia um container temporário;

testa o endpoint /health;

remove o container de teste.

Publicar imagem no GHCR

autentica no GitHub Container Registry;

publica as tags latest e o SHA do commit;

registra a origem e a revisão da imagem.

Implantar no servidor

configura o acesso SSH;

envia o Compose de produção para /opt/devsystem;

autentica a VPS no GHCR;

baixa a nova imagem;

atualiza o container;

verifica o endpoint /health.

Secrets e variáveis

Configure em Settings > Secrets and variables > Actions:

Secret

Conteúdo

DEPLOY_HOST

IP ou domínio da VPS

DEPLOY_USER

Usuário SSH autorizado a executar Docker

DEPLOY_SSH_KEY

Chave SSH privada exclusiva para deploy

DEPLOY_KNOWN_HOSTS

Identidade pública do servidor SSH

GHCR_USERNAME

Usuário autorizado a baixar a imagem

GHCR_READ_TOKEN

Token com permissão read:packages

Variable opcional

Padrão

Finalidade

DEPLOY_PORT

22

Porta SSH

DEPLOY_PATH

/opt/devsystem

Diretório operacional na VPS

HTTP_PORT

8080

Porta local usada no health check

Nunca adicione chaves, tokens, senhas ou o conteúdo real dos secrets ao repositório.

Produção

O arquivo deploy/docker-compose.prod.yml:

exige a variável IMAGE_NAME;

reinicia o container automaticamente;

publica a aplicação apenas em 127.0.0.1:8080 para diagnóstico local;

conecta o container à rede externa proxy;

configura o Traefik para devsystem.tech e www.devsystem.tech;

utiliza o resolvedor letsencrypt;

impede elevação de privilégios com no-new-privileges.

Comandos úteis na VPS:

cd /opt/devsystem
docker compose ps
docker compose logs --tail=100
curl http://127.0.0.1:8080/health
docker inspect devsystem-portfolio --format '{{json .State.Health}}'

Rollback

Cada imagem também é identificada pelo SHA do commit. Para retornar a uma versão anterior:

cd /opt/devsystem
export IMAGE_NAME="ghcr.io/anderson-souza-tech/devsystem-portfolio:SHA_ANTERIOR"
export HTTP_PORT="8080"
docker compose pull
docker compose up -d --remove-orphans
curl http://127.0.0.1:8080/health

Depois do rollback, corrija também a branch main para que um novo deploy não publique novamente a versão com problema.

Arquitetura anterior e laboratórios

As pastas abaixo não participam do site atualmente publicado:

backend/: API FastAPI com endpoints de saúde, arquitetura, skills, projetos e guestbook;

db-init/: tabelas PostgreSQL e dados de demonstração;

frontend/: interface anterior que consumia a API;

k8s/manifests/: laboratório Kubernetes com Namespace, Secret, PostgreSQL, Backend, Frontend, HPA e Ingress;

docker-stack.yml: alternativa de implantação em Docker Swarm.

Esses componentes foram mantidos como material de estudo. Antes de reutilizá-los em produção, é necessário revisar credenciais, domínio, imagens, TLS, segurança e observabilidade.

Tecnologias demonstradas

HTML5, CSS3 e JavaScript

Nginx

Docker e Docker Compose

Traefik e Let's Encrypt

GitHub Actions e GitHub Container Registry

Linux e SSH

Docker Swarm e Kubernetes em laboratório

Autor

Anderson Souza

LinkedIn

GitHub

DevSystem
