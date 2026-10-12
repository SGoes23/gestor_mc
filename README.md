# Gestor MC (Moto Clube)

Monorepo com:
- `mobile/gestor_mc_app`: aplicativo Flutter.
- `backend/gestor-mc-api`: API Spring Boot.
- `docs/`: guias operacionais, Trello e GitHub.

## Stack
- Flutter (mobile)
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

### Endpoints principais da Fase 2 (Mensalidades)
- `POST /api/monthly-fees/generate` (diretoria)
- `PATCH /api/monthly-fees/{id}/status` (diretoria)
- `GET /api/monthly-fees?referenceMonth=YYYY-MM`
- `GET /api/monthly-fees/defaulters?referenceMonth=YYYY-MM`
- `GET /api/monthly-fees/history/member/{memberId}`

## 4) App Flutter
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

## 5) GitHub
Veja `docs/github-setup.md` para fluxo de branch, PR e CI.

## 6) Trello
Use o template em `docs/trello-board-template.md` para criar o quadro inicial.

## 7) Roadmap
Use `docs/roadmap-fases.md` para acompanhar fases, datas e entregaveis.
