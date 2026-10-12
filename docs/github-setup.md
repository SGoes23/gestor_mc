# GitHub setup

## Estrategia de branch
- `main`: producao.
- `develop`: integracao continua.
- `feature/<nome>`: novas funcionalidades.
- `fix/<nome>`: correcoes.

## Padrao de commit (Conventional Commits)
- `feat: cria cadastro de membros`
- `fix: corrige validacao de apelido`
- `docs: atualiza README`

## Fluxo de PR
1. Criar branch a partir de `develop`.
2. Implementar e commitar.
3. Abrir PR para `develop`.
4. Garantir CI verde.
5. Fazer squash merge.

## Comandos iniciais
```powershell
cd gestor_mc
git init
git add .
git commit -m "chore: bootstrap do projeto gestor mc"
git branch -M main
git remote add origin https://github.com/<seu-usuario>/gestor_mc.git
git push -u origin main
```
