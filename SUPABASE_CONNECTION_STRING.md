# 🔐 SUPABASE - CONFIGURAÇÃO NO VERCEL

## ✅ VOCÊ JÁ TEM SUAS CREDENCIAIS!

### Connection Pooling (Recomendado para Vercel)
```
postgresql://postgres.uhwtcqjhircrgmhfzcbt:[SUA-SENHA]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Direct Connection (Para Migrations)
```
postgresql://postgres.uhwtcqjhircrgmhfzcbt:[SUA-SENHA]@aws-1-us-west-2.pooler.supabase.com:5432/postgres
```

---

## 🚀 PRÓXIMO PASSO: CONFIGURAR NO VERCEL

### 1. Vá para Vercel
```
https://vercel.com/dashboard
→ Selecione: banca-no-ponto
→ Clique: Settings
→ Clique: Environment Variables
```

### 2. Adicione 3 Variáveis

**Variável 1: DATABASE_URL**
```
KEY: DATABASE_URL

VALUE: postgresql://postgres.uhwtcqjhircrgmhfzcbt:[COLOQUE_SUA_SENHA_AQUI]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Variável 2: DIRECT_URL**
```
KEY: DIRECT_URL

VALUE: postgresql://postgres.uhwtcqjhircrgmhfzcbt:[COLOQUE_SUA_SENHA_AQUI]@aws-1-us-west-2.pooler.supabase.com:5432/postgres
```

**Variável 3: JWT_SECRET**
```
KEY: JWT_SECRET

VALUE: [GERE UMA CHAVE SEGURA - ou use uma aleatória]
Exemplo: 8f4c2e1a9b7d3f6e5c8a2b9d4f1e7a3c6b9e2d5f8a1c4e7a0d3f6b9c2e5a8
```

### 3. Clique "Save"

### 4. Redeploy
```
Deployments → Clique no mais recente → "Redeploy"
```

---

## 🔒 SEGURANÇA

✅ **IMPORTANTE:**
- Substitua `[SUA-SENHA]` pela senha do seu Supabase
- Nunca compartilhe a string completa publicamente
- Está seguro no Vercel Dashboard (privado)
- Está seguro em variáveis de ambiente

---

## ✅ APÓS CONFIGURAR

Seu app terá:
- ✅ Backend conectado ao Supabase
- ✅ Migrations funcionando
- ✅ Banco de dados em produção
- ✅ App 100% online

---

Data: 2026-05-21  
Status: 🟢 Pronto para configurar
