# 🔐 CONFIGURAR VARIÁVEIS NO VERCEL
# ═════════════════════════════════════════════════════════════════════════

## ✅ INSTRUÇÕES PASSO A PASSO

### Passo 1: Copie suas credenciais
```
DATABASE_URL="postgresql://postgres.uhwtcqjhircrgmhfzcbt:[COLOQUE_SUA_SENHA_AQUI]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.uhwtcqjhircrgmhfzcbt:[COLOQUE_SUA_SENHA_AQUI]@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
```

### Passo 2: Substitua [COLOQUE_SUA_SENHA_AQUI] pela sua senha Supabase

**Exemplo (NÃO USE ISSO):**
```
DATABASE_URL="postgresql://postgres.uhwtcqjhircrgmhfzcbt:abc123XYZ789@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.uhwtcqjhircrgmhfzcbt:abc123XYZ789@aws-1-us-west-2.pooler.supabase.com:5432/postgres"
```

### Passo 3: Adicione JWT_SECRET
```
JWT_SECRET="gere-uma-chave-secreta-aleatoria-muito-segura"
```

Ou use: https://generate-random.org/ para gerar uma chave segura

### Passo 4: Vá para Vercel
- Acesse: https://vercel.com/dashboard
- Selecione seu projeto
- Settings → Environment Variables
- Adicione as 3 variáveis acima
- Clique "Save"

### Passo 5: Redeploy
- Deployments → Clique no deploy recente
- Clique "Redeploy"

---

## 📋 RESUMO DAS VARIÁVEIS

| Variável | Obrigatória | Valor |
|----------|------------|-------|
| DATABASE_URL | ✅ Sim | Connection pooling do Supabase |
| DIRECT_URL | ✅ Sim | Direct connection do Supabase |
| JWT_SECRET | ✅ Sim | Chave secreta aleatória |
| REACT_APP_API_URL | ⏳ Recomendado | /api |

---

## 🔒 SEGURANÇA

⚠️ **IMPORTANTE:**
- NUNCA compartilhe suas credenciais publicamente
- NUNCA coloque senhas em arquivos versionados
- Use apenas variáveis de ambiente do Vercel

✅ **Seguro:**
- Armazenar em Vercel Dashboard
- Armazenar em .env.local (não versionado)
- Usar em processo de build

---

## ✨ PRONTO!

Depois de configurar as variáveis no Vercel:

1. ✅ Backend conecta ao Supabase
2. ✅ Migrations funcionam
3. ✅ App online e funcionando
4. ✅ Banco de dados sincronizado

---

Data: 2026-05-21
