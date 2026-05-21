#!/bin/bash
# Script para auxiliar o deploy no Vercel
# Uso: ./deploy-vercel.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      Preparando Deploy - Banca no Ponto no Vercel         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        exit 1
    fi
}

# 1. Verificar Git
echo -e "${BLUE}1. Verificando Git...${NC}"
if ! git status > /dev/null 2>&1; then
    echo -e "${RED}✗ Não é um repositório Git. Inicialize com: git init${NC}"
    exit 1
fi
check_status "Repositório Git encontrado"

# 2. Verificar alterações não commitadas
echo -e "${BLUE}2. Verificando alterações...${NC}"
if ! git diff --quiet; then
    echo -e "${YELLOW}⚠ Há alterações não commitadas. Commitando...${NC}"
    git add .
    git commit -m "Preparado para deploy no Vercel" || check_status "Commit criado"
fi
check_status "Repositório limpo para deploy"

# 3. Verificar Branch remota
echo -e "${BLUE}3. Verificando repositório remoto...${NC}"
if git remote -v | grep -q origin; then
    check_status "Repositório remoto configurado"
else
    echo -e "${YELLOW}⚠ Nenhum repositório remoto configurado.${NC}"
    echo "   Execute: git remote add origin <sua-url-github>"
    exit 1
fi

# 4. Fazer push
echo -e "${BLUE}4. Enviando código para o repositório remoto...${NC}"
git push origin $(git rev-parse --abbrev-ref HEAD)
check_status "Código enviado com sucesso"

# 5. Verificar Vercel CLI
echo -e "${BLUE}5. Verificando Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠ Vercel CLI não encontrada. Instalando...${NC}"
    npm install -g vercel
fi
check_status "Vercel CLI disponível"

# 6. Fazer login no Vercel
echo -e "${BLUE}6. Verificando autenticação Vercel...${NC}"
if [ ! -d ~/.vercel ]; then
    echo -e "${YELLOW}⚠ Faça login no Vercel:${NC}"
    vercel login
fi
check_status "Autenticação Vercel confirmada"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Pronto para Deploy no Vercel!                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Próximos passos:"
echo "1. Via Web Dashboard (Recomendado):"
echo "   → Acesse https://vercel.com/dashboard"
echo "   → Clique 'New Project'"
echo "   → Selecione seu repositório"
echo "   → Configure variáveis de ambiente"
echo "   → Clique 'Deploy'"
echo ""
echo "2. Via CLI:"
echo "   → Execute: vercel --prod"
echo "   → Configure as variáveis quando solicitado"
echo ""
echo "Documentação: Consulte DEPLOY_VERCEL.md neste diretório"
echo ""
