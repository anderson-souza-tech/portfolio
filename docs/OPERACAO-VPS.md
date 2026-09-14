# Operação técnica — DevSystem Portfolio

> Referência do ambiente de produção, Docker, Nginx, Traefik, SSL, pipeline, atualização e diagnóstico.
>
> Revisão: 14/09/2026

## 1. Visão geral

| Item | Configuração |
|---|---|
| Projeto | DevSystem Portfolio |
| URLs | `https://devsystem.tech` e `https://www.devsystem.tech` |
| VPS | Ubuntu 24.04.4 — `2.25.67.96` |
| Host | `srv1975716` |
| Usuário operacional | `devsystem` |
| Diretório de produção | `/opt/devsystem` |
| Repositório | `anderson-souza-tech/portfolio` |
| Branch de produção | `main` |
| Servidor web | Nginx Alpine |
| Proxy e SSL | Traefik + Let's Encrypt |
| Registro de imagens | GitHub Container Registry — GHCR |
| Implantação | GitHub Actions |

## 2. Arquitetura

```text
Visitante
   │
   ├── devsystem.tech
   └── www.devsystem.tech
          │ HTTPS :443
          ▼
       Traefik
       rede: proxy
          │
          ▼
 devsystem-portfolio :80
          │
          ▼
        Nginx
          │
          └── HTML, CSS, JavaScript e imagens
```

| Container | Função | Exposição |
|---|---|---|
| `traefik` | Entrada HTTP/HTTPS, domínio e certificado | Portas 80 e 443 da VPS |
| `devsystem-portfolio` | Nginx e arquivos estáticos | Rede `proxy` e `127.0.0.1:8080` |

O Traefik encaminha os domínios ao Nginx pela rede `proxy`. A porta `127.0.0.1:8080` serve somente para diagnóstico dentro da VPS.

## 3. Persistência e banco de dados

O portfólio não utiliza banco de dados e não possui volume de dados da aplicação.

- O conteúdo está em `site/`.
- O código-fonte é preservado no GitHub.
- Cada versão implantada é preservada no GHCR pela tag `latest` e pelo SHA do commit.
- Recriar o container não apaga conteúdo, pois o site é reconstruído a partir do repositório.

## 4. Arquivos utilizados

| Arquivo | Finalidade |
|---|---|
| `site/index.html` | Estrutura, textos, links e seções. |
| `site/styles.css` | Cores, layout, animações e responsividade. |
| `site/app.js` | Menu móvel e comportamento da página. |
| `site/assets/` | Fotografia, favicon e imagens. |
| `nginx/default.conf` | Nginx, cache, headers e `/health`. |
| `Dockerfile` | Imagem baseada em `nginx:alpine`. |
| `docker-compose.yml` | Ambiente local de desenvolvimento. |
| `deploy/docker-compose.prod.yml` | Modelo enviado pela pipeline à VPS. |
| `/opt/devsystem/docker-compose.yml` | Compose usado em produção. |
| `.github/workflows/pipeline.yml` | Validação, publicação e implantação. |
| `docker-stack.yml` | Laboratório Swarm; não usado na produção atual. |

## 5. Acesso à VPS

```bash
ssh devsystem@2.25.67.96
cd /opt/devsystem
pwd
```

Resultado esperado: `/opt/devsystem`.

## 6. Checklist rápido diário

### Status

```bash
docker ps --filter name=devsystem-portfolio --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}'
```

O container `devsystem-portfolio` deve aparecer como `Up` e `healthy`.

### Saúde interna e pública

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsSI https://devsystem.tech
curl -fsSI https://www.devsystem.tech
```

O primeiro comando deve retornar `healthy`.

### Estado e recursos

```bash
docker inspect devsystem-portfolio --format '{{.State.Status}} / {{.State.Health.Status}}'
docker stats --no-stream devsystem-portfolio
```

## 7. Comandos da aplicação e Docker

### Logs

```bash
docker logs -f --tail=200 devsystem-portfolio
docker logs --since=30m --tail=200 devsystem-portfolio
```

Use `Ctrl+C` para sair dos logs em tempo real sem parar o container.

### Reiniciar, parar e iniciar

```bash
docker restart devsystem-portfolio
docker stop devsystem-portfolio
docker start devsystem-portfolio
```

Enquanto o container estiver parado, o site ficará indisponível.

### Validar Nginx e versão

```bash
docker exec devsystem-portfolio nginx -t
docker exec devsystem-portfolio nginx -v
```

### Imagem e reinicializações

```bash
docker inspect devsystem-portfolio --format '{{.Config.Image}}'
docker inspect devsystem-portfolio --format 'reinícios={{.RestartCount}} erro={{.State.Error}}'
```

## 8. Pipeline CI/CD

Fluxo oficial:

1. alteração enviada para uma branch;
2. pull request para `main`;
3. construção e teste de container temporário;
4. merge do pull request;
5. publicação das tags `latest` e SHA no GHCR;
6. envio do Compose para `/opt/devsystem/docker-compose.yml`;
7. download e substituição da imagem na VPS;
8. teste de `http://127.0.0.1:8080/health`.

Execuções: `https://github.com/anderson-souza-tech/portfolio/actions`.

### Secrets do ambiente `production`

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`
- `GHCR_USERNAME`
- `GHCR_READ_TOKEN`

### Variáveis

| Variável | Valor |
|---|---|
| `DEPLOY_PORT` | `22` |
| `DEPLOY_PATH` | `/opt/devsystem` |
| `HTTP_PORT` | `8080` |

Nunca registre tokens, chaves privadas ou valores dos secrets na documentação.

## 9. Recriar o container com a imagem atual

```bash
cd /opt/devsystem
portfolio_image="$(docker inspect devsystem-portfolio --format '{{.Config.Image}}')"
IMAGE_NAME="$portfolio_image" HTTP_PORT=8080 docker compose up -d --force-recreate
```

Valide:

```bash
docker inspect devsystem-portfolio --format '{{.State.Status}} / {{.State.Health.Status}}'
curl -fsS http://127.0.0.1:8080/health
curl -fsSI https://devsystem.tech
```

## 10. Rollback

Liste as imagens disponíveis:

```bash
docker images ghcr.io/anderson-souza-tech/devsystem-portfolio --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedSince}}\t{{.ID}}'
```

Registre a versão atual antes de trocar:

```bash
docker inspect devsystem-portfolio --format '{{.Config.Image}}'
```

Implante uma tag SHA anterior:

```bash
cd /opt/devsystem
IMAGE_NAME="ghcr.io/anderson-souza-tech/devsystem-portfolio:SHA_DO_COMMIT" HTTP_PORT=8080 docker compose pull
IMAGE_NAME="ghcr.io/anderson-souza-tech/devsystem-portfolio:SHA_DO_COMMIT" HTTP_PORT=8080 docker compose up -d
```

Valide:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsSI https://devsystem.tech
docker logs --since=10m --tail=100 devsystem-portfolio
```

Um novo deploy de `main` voltará a implantar a versão mais recente.

## 11. Traefik, SSL, DNS e firewall

### Traefik e redes

```bash
docker ps --filter name=traefik
docker logs --since=30m --tail=200 traefik
docker network inspect proxy
docker network inspect devsystem-network
docker inspect devsystem-portfolio --format '{{range $name, $network := .NetworkSettings.Networks}}{{println $name}}{{end}}'
```

O portfólio deve estar nas redes `proxy` e `devsystem-network`.

### DNS

```bash
dig +short devsystem.tech
dig +short www.devsystem.tech
```

Configuração prevista:

- `devsystem.tech` apontando para `2.25.67.96`;
- `www.devsystem.tech` como CNAME de `devsystem.tech`.

### Certificado

```bash
echo | openssl s_client -connect devsystem.tech:443 -servername devsystem.tech 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

O Traefik emite e renova o certificado usando o resolver `letsencrypt`.

### Firewall

```bash
sudo ufw status numbered
```

Portas previstas: `22/tcp`, `80/tcp` e `443/tcp`. A porta 8080 não deve ser publicada externamente.

## 12. Desenvolvimento local

```bash
docker compose up -d --build
docker compose ps
curl -fsS http://127.0.0.1:8080/health
docker compose logs --tail=100
docker compose down
```

O `docker-compose.yml` local é diferente do Compose de produção.

## 13. Fluxo de alteração

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/nome-da-alteracao
```

Depois de editar:

```bash
git status
git diff
docker compose up -d --build
curl -fsS http://127.0.0.1:8080/health
git add .
git commit -m "feat: descreva a alteração"
git push -u origin HEAD
```

Abra um pull request para `main`. A implantação ocorre depois do merge.

## 14. Cache do navegador

O Nginx configura cache de 30 dias para CSS, JavaScript e imagens. Depois de uma atualização visual, o navegador pode exibir arquivos anteriores.

- Windows/Linux: `Ctrl+F5`;
- macOS: `Command+Shift+R`;
- alternativa: janela anônima.

## 15. Diagnóstico

### Site não abre

```bash
docker ps --filter name=devsystem-portfolio
docker logs --since=30m --tail=200 devsystem-portfolio
docker logs --since=30m --tail=200 traefik
curl -v http://127.0.0.1:8080/health
curl -vkI https://devsystem.tech
```

### Container não fica saudável

```bash
docker inspect devsystem-portfolio --format '{{json .State.Health}}'
docker exec devsystem-portfolio nginx -t
docker logs --tail=200 devsystem-portfolio
```

### Problema apenas com um domínio

```bash
dig +short devsystem.tech
dig +short www.devsystem.tech
docker inspect devsystem-portfolio --format '{{json .Config.Labels}}'
docker logs --since=30m --tail=200 traefik
```

### Porta interna e espaço

```bash
ss -lntp | grep 8080
curl -v http://127.0.0.1:8080/health
df -h
docker system df
```

## 16. Proteção e recuperação

As fontes de recuperação são o GitHub, o histórico de commits, as imagens versionadas no GHCR e o Compose da VPS.

Guardar uma cópia do Compose:

```bash
cd /opt/devsystem
mkdir -p backups
cp docker-compose.yml "backups/docker-compose-$(date +%Y%m%d-%H%M%S).yml"
ls -lhtr backups/
```

## 17. Comandos que exigem cuidado

Evite na VPS sem análise:

```bash
docker compose down
docker network rm proxy
docker system prune -a
docker system prune --volumes
sudo ufw delete NUMERO_DA_REGRA
```

Esses comandos podem deixar o site indisponível, interromper o Traefik, eliminar imagens locais de rollback ou bloquear o acesso à VPS. O `docker image prune -f` usado pela pipeline remove apenas imagens sem uso.

## 18. Resumo de emergência

```bash
ssh devsystem@2.25.67.96
cd /opt/devsystem
docker ps --filter name=devsystem-portfolio
docker logs --since=15m --tail=100 devsystem-portfolio
docker logs --since=15m --tail=100 traefik
curl -fsS http://127.0.0.1:8080/health
curl -fsSI https://devsystem.tech
df -h
```

Se o Traefik estiver saudável e somente o portfólio apresentar falha:

```bash
docker restart devsystem-portfolio
```
