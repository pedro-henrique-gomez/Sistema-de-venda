# TODO - banco no ponto

## Objetivo
Manter o DB no Supabase/Vercel e garantir que backups não dependam de arquivo local `dev.db`.

## Passos
1. [x] Confirmar que o backend usa PostgreSQL/`DATABASE_URL` via Prisma.
2. [x] Ajustar `backend/scripts/backup.js` para NÃO copiar `./prisma/dev.db` (desativado/erro explícito).
3. [x] Ajustar `backend/scripts/scheduler.js` para não rodar backup em Supabase.
4. [ ] Remover/neutralizar scripts `backup:restore` (ou fazer fallback seguro) para Supabase.

5. [ ] Atualizar `README.md` com instruções de backups para Supabase.
6. [ ] Validar que o deploy no Vercel funciona sem tentar acessar `.db` local.

