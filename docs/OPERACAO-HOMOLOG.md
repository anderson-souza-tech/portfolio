# Operação técnica — DevSystem Portfolio (Homologação)

## 1. Visão geral

Ambiente de homologação do Portfólio DEVSYSTEM, executado em
uma VM Ubuntu Server no Proxmox.

Objetivo: validar imagens e alterações antes da publicação em produção.

Este ambiente é independente da VPS de produção e da aplicação Consultas.

## 2. Arquitetura

Fluxo de entrega:

GitHub (homolog/infraestrutura)
  -> GitHub Actions
  -> Build e testes
  -> GHCR (imagem homolog-SHA)
  -> Deploy manual na VM
  -> Docker Compose
  -> Nginx

Acesso HTTP local: 127.0.0.1:8088

O acesso remoto é realizado por túnel SSH, sem publicação direta
da porta 8088 na internet.

## 3. Arquivos e caminhos

Diretório do projeto:
  /opt/devsystem/apps/portfolio

Compose:
  compose.homolog.yml

Versão aprovada:
  .env

Workflow:
  .github/workflows/homolog.yml

Documentação de produção:
  docs/OPERACAO-VPS.md

## 4. Pipeline CI/CD

Branch: homolog/infraestrutura

O workflow realiza:
- Validação dos arquivos obrigatórios
- Build da imagem Docker
- Teste do endpoint /health
- Publicação no GHCR com a tag homolog-SHA

O pipeline não realiza deploy automático.

A produção possui workflow independente.

## 5. Consultar versão implantada

docker inspect devsystem-portfolio-homolog-web-1 \
  --format 'Status={{.State.Status}} | Health={{.State.Health.Status}} | Image={{.Config.Image}}'

A imagem efetiva deve corresponder à versão aprovada no .env.

## 6. Validar aplicação

docker compose --env-file .env -f compose.homolog.yml config --images

docker compose --env-file .env -f compose.homolog.yml ps

curl -fsS http://127.0.0.1:8088/health

curl -fsS -o /dev/null -w 'HTTP: %{http_code}\n' \
  http://127.0.0.1:8088/

Um HTTP 200 e um health check saudável não substituem
a homologação funcional no navegador.

## 7. Procedimento de deploy

Pré-requisitos:
- Imagem aprovada no GitHub Actions
- Imagem disponível no GHCR
- Identificação da versão atual
- Referência de rollback preservada
- Autorização para atualização

Executar a partir de /opt/devsystem/apps/portfolio.

1. Registrar a imagem atualmente em execução.
2. Confirmar a disponibilidade da nova imagem.
3. Baixar a nova imagem:

   docker pull IMAGEM_APROVADA

4. Atualizar PORTFOLIO_IMAGE no arquivo .env.
5. Validar a configuração:

   docker compose --env-file .env -f compose.homolog.yml config --images

6. Após autorização, implantar:

   docker compose --env-file .env -f compose.homolog.yml up -d --no-deps web

7. Validar container, health check, HTTP e interface.
8. Registrar SHA, resultado e eventuais ocorrências.

A atualização pode provocar breve indisponibilidade.

## 8. Rollback — Procedimento validado

Status: TESTADO EM 17/11/2026 — rollback por imagem e restauração da versão aprovada.

Em caso de falha:

1. Identificar a última imagem comprovadamente funcional.
2. Atualizar PORTFOLIO_IMAGE no .env para essa imagem.
3. Validar a configuração resolvida pelo Compose.
4. Após autorização, recriar somente o serviço web.
5. Confirmar health check, HTTP e navegação.
6. Registrar o incidente e a versão restaurada.

Não executar limpeza de imagens antes de confirmar
que a versão de retorno está preservada.

## 9. Diagnóstico

Verificar estado:

docker compose --env-file .env -f compose.homolog.yml ps

Consultar logs:

docker compose --env-file .env -f compose.homolog.yml logs --tail=100 web

Consultar a imagem:

docker inspect devsystem-portfolio-homolog-web-1 \
  --format '{{.Config.Image}}'

Investigar falhas antes de reiniciar ou recriar containers.

## 10. Segurança e isolamento

- Porta HTTP vinculada ao loopback da VM
- Acesso administrativo via SSH
- Deploy Key da VM com permissão de leitura
- Sem credenciais de produção no workflow de homologação
- Arquivo .env ignorado pelo Git
- Docker Compose com no-new-privileges:true

O grupo docker concede privilégios equivalentes a root.

A rede Docker chamada internal utiliza driver bridge;
ela não está configurada com internal: true.

## 11. Pendências

- Testar recuperação completa após perda da VM ou do armazenamento
- Avaliar fixação da versão base do Nginx
- Definir processo de aprovação das imagens
- Avaliar automação futura do deploy
- Revisar proteção de branches e environments
- Manter o pipeline de produção independente

## 12. Estado validado em 17/11/2026

- Pipeline de homologação executada com sucesso
- Imagem publicada no GHCR
- Deploy manual pela imagem versionada concluído
- Container running/healthy
- Página principal respondendo HTTP 200
- Versão aprovada persistida no .env
- Rollback para 6e4eaf3 e restauração de homolog-1e03e11 validados com health check saudável e HTTP 200
