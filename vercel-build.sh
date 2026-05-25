#!/bin/bash

# Install dependencies
npm ci

# Generate Prisma client
cd backend && npx prisma generate && cd ..

# Build frontend
cd frontend && npm ci && npm run build && cd ..

# Ensure build directory exists
ls -la frontend/build/
