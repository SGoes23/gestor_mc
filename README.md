# Gestor MC (Moto Clube)

Monorepo com:
- `mobile/gestor_mc_app`: aplicativo Flutter.
- `backend/gestor-mc-api`: API Spring Boot.
- `web/gestor_mc_web`: aplicacao web React.
- `docs/`: guias operacionais, Trello e GitHub.

## Stack
- Flutter (mobile)
- React + TypeScript + Vite (web)
- Spring Boot 3 + JPA + Flyway (backend)
- PostgreSQL (Supabase)
- GitHub (versionamento e CI)
- Trello (gestao de tarefas)

## 1) Pre-requisitos
Instale no Windows:
- Git
- JDK 21
- Maven 3.9+
- Flutter SDK
- Android Studio (para emulador/SDK Android)

## 2) Configuracao de ambiente
1. Copie `.env.example` para `.env`.
2. Preencha as credenciais do banco Supabase.

## 3) Backend Spring Boot
Diretorio: `backend/gestor-mc-api`

### Rodar localmente
No PowerShell:
```powershell
$env:DB_HOST="db.<project-ref>.supabase.co"
$env:DB_PORT="5432"
$env:DB_NAME="postgres"
$env:DB_USER="postgres"
$env:DB_PASSWORD="your_password"
$env:SPRING_PROFILES_ACTIVE="dev"
$env:JWT_SECRET="uma-chave-segura-com-mais-de-32-caracteres"
# Opcional: sobrescrever usuarios iniciais
# $env:ADMIN_EMAIL="diretoria@gestormc.local"
# $env:ADMIN_PASSWORD="admin123"
# $env:MEMBER_EMAIL="membro@gestormc.local"
# $env:MEMBER_PASSWORD="membro123"

cd backend/gestor-mc-api
mvn spring-boot:run
```

API base: `http://localhost:8080`
Healthcheck: `GET /api/health`

### Rodar com Docker

O `docker-compose.yml` localizado em `backend/gestor-mc-api` sobe a API e um banco PostgreSQL local. Na primeira execucao, o Docker constroi a aplicacao e o Flyway aplica automaticamente as migrations do banco.

No PowerShell:

```powershell
cd backend/gestor-mc-api
docker compose up --build -d
```

Servicos e credenciais padrao:

- API: `http://localhost:8081`
- Healthcheck: `http://localhost:8081/api/health`
- PostgreSQL: `localhost:5433`
- Banco: `gestor_mc`
- Usuario: `gestor_mc`
- Senha: `gestor_mc_local`

Para acompanhar os logs da API:

```powershell
docker compose logs -f api
```

Para parar e remover os containers:

```powershell
docker compose down
```

Os dados do PostgreSQL sao mantidos no volume Docker `postgres_data`. Para alterar as portas publicadas, defina `API_PORT` e/ou `DB_EXTERNAL_PORT` antes de subir os servicos:

```powershell
$env:API_PORT="8082"
$env:DB_EXTERNAL_PORT="5434"
docker compose up --build -d
```

#### Variaveis de ambiente do Docker Compose

Ao executar o comando dentro de `backend/gestor-mc-api`, o Docker Compose procura as variaveis primeiro no terminal atual e depois no arquivo `backend/gestor-mc-api/.env`. Quando uma variavel nao foi definida, ele usa o valor padrao declarado no `docker-compose.yml`.

Por exemplo, esta expressao:

```yaml
DB_NAME: ${DB_NAME:-gestor_mc}
```

usa o valor da variavel `DB_NAME`, caso ela exista. Caso contrario, usa `gestor_mc`.

Para manter uma configuracao especifica para os containers, crie o arquivo `backend/gestor-mc-api/.env`:

```env
DB_NAME=gestor_mc
DB_USER=gestor_mc
DB_PASSWORD=uma_senha_local_segura
DB_EXTERNAL_PORT=5433
API_PORT=8081
SPRING_PROFILES_ACTIVE=dev
JWT_SECRET=uma-chave-segura-com-mais-de-32-caracteres
JWT_EXPIRATION_MINUTES=120
```

Depois execute normalmente:

```powershell
cd backend/gestor-mc-api
docker compose up --build -d
```

O `.env` existente na raiz do monorepo nao e carregado automaticamente quando o comando e executado dentro de `backend/gestor-mc-api`. Para usa-lo, informe explicitamente o caminho com `--env-file`:

```powershell
cd backend/gestor-mc-api
docker compose --env-file ../../.env up --build -d
```

Outra opcao e executar a partir da raiz do monorepo e informar tanto o arquivo Compose quanto o arquivo de variaveis:

```powershell
docker compose `
  --env-file .env `
  -f backend/gestor-mc-api/docker-compose.yml `
  up --build -d
```

No ambiente Docker, `DB_HOST` e `DB_PORT` da API sao definidos como `db` e `5432`. `db` e o nome do servico PostgreSQL dentro da rede privada do Compose. Por isso, valores como `DB_HOST` apontando para o Supabase no `.env` da raiz nao substituem a conexao interna entre a API e o banco local. As variaveis `DB_NAME`, `DB_USER` e `DB_PASSWORD`, por outro lado, sao aplicadas tanto na criacao do PostgreSQL quanto na conexao da API.

Variaveis definidas no terminal tem prioridade sobre as mesmas variaveis presentes no arquivo informado. Exemplo:

```powershell
$env:API_PORT="8082"
docker compose --env-file ../../.env up --build -d
```

Nesse caso, a API sera publicada em `http://localhost:8082`, mesmo que o arquivo `.env` defina outro valor para `API_PORT`.

### Endpoints principais da Fase 2 (Mensalidades)
- `POST /api/monthly-fees/generate` (diretoria)
- `PATCH /api/monthly-fees/{id}/status` (diretoria)
- `GET /api/monthly-fees?referenceMonth=YYYY-MM`
- `GET /api/monthly-fees/defaulters?referenceMonth=YYYY-MM`
- `GET /api/monthly-fees/history/member/{memberId}`

## 4) Aplicacao Web

Diretorio: `web/gestor_mc_web`

Com a API Docker em execucao na porta `8081`, instale as dependencias e inicie o Vite:

```powershell
cd web/gestor_mc_web
npm.cmd install
npm.cmd run dev
```

Acesse `http://localhost:5173`.

O endereco da API pode ser alterado criando `web/gestor_mc_web/.env`:

```env
VITE_API_BASE_URL=http://localhost:8081
```

Para validar e gerar o pacote de producao:

```powershell
npm.cmd run build
```

## 5) App Flutter
Diretorio: `mobile/gestor_mc_app`

Como o Flutter nao esta instalado neste ambiente de bootstrap, gere os arquivos de plataforma na sua maquina apos instalar o SDK:
```powershell
cd mobile/gestor_mc_app
flutter create .
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080
```

Credenciais iniciais (criadas automaticamente na API):
- diretoria@gestormc.local / admin123
- membro@gestormc.local / membro123

No app da Fase 2:
- Icone de calendario na tela de membros: mensalidades do mes
- Icone de alerta na tela de membros: inadimplentes
- Em detalhes do membro: historico de mensalidades

## 6) GitHub
Veja `docs/github-setup.md` para fluxo de branch, PR e CI.

## 7) Trello
Use o template em `docs/trello-board-template.md` para criar o quadro inicial.

## 8) Roadmap
Use `docs/roadmap-fases.md` para acompanhar fases, datas e entregaveis.
