#!/bin/bash
# Script para build do frontend no Linux/Mac

cd "$(dirname "$0")/frontend" || exit 1

echo ""
echo "========================================"
echo "   Banca no Ponto - Frontend Build"
echo "========================================"
echo ""

echo "[1/2] Installing dependencies..."
echo ""
npm install || { echo "ERROR: npm install failed"; exit 1; }

echo ""
echo "[2/2] Building frontend..."
echo ""
npm run build || { echo "ERROR: npm run build failed"; exit 1; }

echo ""
echo "========================================"
echo "   ✓ Build completed successfully!"
echo "========================================"
echo ""
echo "Frontend files generated in: frontend/build"
echo ""
