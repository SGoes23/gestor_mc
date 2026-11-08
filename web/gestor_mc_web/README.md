# Gestor MC Web

Aplicacao web responsiva do Leopardos Moto Clube, criada com React, TypeScript e Vite. Consome a mesma API Spring Boot utilizada pelo aplicativo mobile.

## Pre-requisitos

- Node.js 20 ou superior
- API `gestor-mc-api` em execucao

## Configuracao

Copie `.env.example` para `.env` caso precise alterar o endereco da API:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_LOG_LEVEL=debug

Os logs estruturados sao exibidos no console do navegador e os 200 registros mais recentes ficam armazenados em `localStorage` com a chave `gestor-mc-frontend-logs`. Em producao, use `VITE_LOG_LEVEL=info`; os valores aceitos sao `debug`, `info`, `warn` e `error`.

## Executar localmente

No PowerShell:

```powershell
cd web/gestor_mc_web
npm.cmd install
npm.cmd run dev
```

Acesse `http://localhost:5173`.

## Build de producao

```powershell
npm.cmd run build
npm.cmd run preview
```

## Docker

Para gerar a imagem de producao e publicar o frontend em `http://localhost`:

```powershell
docker compose up -d --build
```

O endereco da API e incorporado ao bundle durante o build. Para usar outro endereco:

```powershell
$env:VITE_API_BASE_URL="https://api.exemplo.com"
docker compose up -d --build --force-recreate
```

O container disponibiliza o healthcheck em `http://localhost/health` e o Nginx usa fallback para as rotas do React Router.

## Funcionalidades

- Login com sessao persistida no navegador
- Dashboard com indicadores do clube
- Consulta e manutencao de membros
- Cadastro de motocicletas por membro
- Agenda de eventos, passeios e reunioes
- Geracao e acompanhamento de mensalidades
- Consulta de inadimplentes
- Historico financeiro individual
- Permissoes diferentes para diretoria e membros
