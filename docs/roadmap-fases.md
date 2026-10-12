# Roadmap por fases - Gestor MC

## Visao geral
- Fase 0: Preparacao (1 semana)
- Fase 1: Base do app (3 a 4 semanas)
- Fase 2: Mensalidades (2 a 3 semanas)

Data de inicio do projeto: ___/___
Data estimada de termino da Fase 2: ___/___

## FASE 0: PREPARACAO
Objetivo: ter o ambiente pronto e o projeto desenhado
Estimativa: 1 semana
Inicio: ___/___
Fim: ___/___

### Checklist
- [ ] Instalar Flutter, Android Studio, Java (JDK) e PostgreSQL
- [ ] Criar o repositorio no GitHub (app e API)
- [ ] Criar o quadro do projeto no Trello com as fases deste roadmap
- [ ] Criar o banco no Supabase, Neon ou Render
- [ ] Desenhar o modelo de dados (tabelas do dominio)
- [ ] Rascunhar no papel as telas principais

### Entregaveis da fase
- Ambiente local funcionando
- Repositorio remoto criado com padrao de branch
- Quadro Trello criado
- Banco provisionado e credenciais testadas
- Modelo de dados validado
- Fluxo de telas definido

## FASE 1: BASE DO APP
Objetivo: cadastrar e consultar membros e motos
Estimativa: 3 a 4 semanas
Inicio: ___/___
Fim: ___/___

### Checklist
- [x] API: criar projeto Spring Boot conectado ao PostgreSQL
- [x] API: login com e-mail e senha (token JWT)
- [x] API: perfis de acesso (diretoria edita, membro so consulta)
- [x] API: cadastro, edicao, listagem e exclusao de membros
- [x] API: cadastro de motos ligado ao membro
- [x] App: tela de login
- [x] App: lista de membros com busca
- [x] App: tela de detalhes do membro com suas motos
- [x] App: formularios de cadastro e edicao

### Entregaveis da fase
- API autenticada e autorizada
- CRUD de membros e motos completo
- App com fluxo funcional de login e consulta/cadastro

## FASE 2: MENSALIDADES
Objetivo: controlar quem pagou e quem deve
Estimativa: 2 a 3 semanas
Inicio: ___/___
Fim: ___/___

### Checklist
- [x] API: gerar mensalidades por membro e por mes
- [x] API: marcar como pago ou pendente
- [x] API: consultar historico e inadimplentes
- [x] App: tela de mensalidades do mes
- [x] App: lista de inadimplentes
- [x] App: historico de pagamentos por membro

### Entregaveis da fase
- Regras de mensalidade implementadas
- Painel de inadimplencia disponivel no app
- Historico por membro com status e datas

## Riscos e dependencias
- Sem Android SDK/Flutter configurados, o app nao compila localmente
- Sem JDK/Maven, a API nao sobe localmente
- JWT e perfis exigem definicao clara de papeis na diretoria
- Recomendado definir padrao de teste antes de concluir a Fase 1
