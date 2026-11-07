# Gestor MC Web

Aplicacao web responsiva do Leopardos Moto Clube, criada com React, TypeScript e Vite. Consome a mesma API Spring Boot utilizada pelo aplicativo mobile.

## Pre-requisitos

- Node.js 20 ou superior
- API `gestor-mc-api` em execucao

## Configuracao

Copie `.env.example` para `.env` caso precise alterar o endereco da API:

```env
VITE_API_BASE_URL=http://localhost:8081
```

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
