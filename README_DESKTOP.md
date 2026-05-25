# 🖥️ Banca no Ponto - Aplicativo Desktop

## 📋 Sobre

Transformei seu sistema "Banca no Ponto" em um aplicativo desktop profissional usando Electron! Agora você pode distribuir seu sistema como um programa instalável para Windows, Mac e Linux.

## 🚀 Como Usar

### Opção 1: Instalação Automática (Recomendado)
1. **Dê duplo clique** no arquivo `INSTALAR_APP.bat`
2. Aguarde o processo de build (pode demorar alguns minutos na primeira vez)
3. Siga as instruções para instalar o aplicativo

### Opção 2: Build Manual
```bash
# Instalar todas as dependências
npm run install:all

# Fazer build do aplicativo
npm run build

# Build para plataforma específica
npm run build:win    # Windows
npm run build:mac    # macOS  
npm run build:linux  # Linux
```

## 📁 Estrutura do Projeto

```
banca-no-ponto/
├── backend/                 # Servidor Node.js/Express
├── frontend/                # Aplicação React
├── electron/                # Configuração Electron
│   ├── main.js             # Janela principal
│   ├── preload.js          # Segurança
│   ├── package.json        # Dependências Electron
│   └── assets/             # Ícones e recursos
├── INSTALAR_APP.bat        # Instalador automático
├── build-desktop.js        # Script de build
└── README_DESKTOP.md       # Este arquivo
```

## ✅ Recursos do Aplicativo Desktop

### 🎯 Funcionalidades Principais
- **Auto-inicialização**: O backend inicia automaticamente com o app
- **Interface nativa**: Janela desktop com menu e controles nativos
- **Instalador completo**: Com atalhos na área de trabalho e menu iniciar
- **Multiplataforma**: Windows, macOS e Linux

### 🔧 Características Técnicas
- **Electron 28**: Última versão estável
- **Segurança**: Context isolation e preload scripts
- **Performance**: Build otimizado para produção
- **Auto-update**: Pronto para futuras atualizações

## 📦 Arquivos Gerados

Após o build, você encontrará:

### Windows
- `Banca no Ponto Setup 1.0.0.exe` - Instalador completo
- `Banca no Ponto.exe` - Executável direto

### macOS
- `Banca no Ponto-1.0.0.dmg` - Instalador DMG
- `Banca no Ponto.app` - Aplicativo macOS

### Linux
- `Banca no Ponto-1.0.0.AppImage` - Aplicativo portátil

## 🎮 Como o Aplicativo Funciona

1. **Inicialização**: 
   - O Electron inicia a janela principal
   - Automaticamente inicia o backend Node.js
   - Carrega o frontend React

2. **Funcionamento**:
   - Backend roda internamente na porta 3001
   - Frontend se comunica via localhost
   - Dados persistem no banco de dados Prisma

3. **Encerramento**:
   - Ao fechar, o backend é encerrado automaticamente
   - Nenhum processo fica rodando em segundo plano

## 🔧 Desenvolvimento

Para desenvolver o aplicativo desktop:

```bash
# Modo desenvolvimento
cd electron
npm run dev

# Build para produção
npm run build

# Build específico por plataforma
npm run build-win
npm run build-mac  
npm run build-linux
```

## 🐛 Solução de Problemas

### Problemas Comuns

**1. "Node.js não encontrado"**
- Instale o Node.js em https://nodejs.org/
- Reinicie o computador após a instalação

**2. "Porta 3001 em uso"**
- Feche outros aplicativos que possam estar usando a porta
- Use o `PARAR_SISTEMA.bat` original para limpar processos

**3. "Build falhou"**
- Execute `npm run clean` para limpar caches
- Tente instalar dependências novamente com `npm run install:all`

**4. "Aplicativo não inicia"**
- Verifique se o antivirus não está bloqueando
- Execute como administrador na primeira vez

## 📞 Suporte

Se tiver problemas:

1. **Verifique os requisitos**:
   - Windows 10+ / macOS 10.14+ / Linux (Ubuntu 18.04+)
   - Node.js 18+ (para desenvolvimento)
   - 4GB+ de RAM recomendado

2. **Logs de erro**:
   - Em desenvolvimento: F12 para abrir DevTools
   - Em produção: Verifique console do sistema operacional

3. **Backup dos dados**:
   - Seus dados ficam em `backend/prisma/dev.db`
   - Faça backup regular deste arquivo

## 🎉 Próximos Passos

Agora você pode:

1. **Distribuir o instalador** para outros computadores
2. **Customizar o ícone** em `electron/assets/`
3. **Configurar auto-update** para atualizações automáticas
4. **Criar versões personalizadas** para diferentes clientes

---

**Parabéns! Seu sistema "Banca no Ponto" agora é um aplicativo desktop profissional! 🚀**
