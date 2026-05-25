const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configurações de backup
const BACKUP_CONFIG = {
  // Supabase/Postgres gerenciado NÃO é um arquivo local .db.
  // Esse script foi desativado para evitar backups/restore incorretos.
  DATABASE_PATH: null,
  BACKUP_DIR: './backups',
  MAX_BACKUPS: 7, // Manter últimos 7 dias
  BACKUP_PREFIX: 'backup_banca_no_ponto_',
  COMPRESS: true // Compactar backups mais antigos
};

// Criar diretório de backups se não existir
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_CONFIG.BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_CONFIG.BACKUP_DIR, { recursive: true });
    console.log('📁 Diretório de backups criado:', BACKUP_CONFIG.BACKUP_DIR);
  }
};

// Limpar backups antigos
const cleanOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_CONFIG.BACKUP_DIR);
    const backupFiles = files.filter(file => 
      file.startsWith(BACKUP_CONFIG.BACKUP_PREFIX) && file.endsWith('.db')
    );

    // Ordenar por data de modificação (mais recente primeiro)
    backupFiles.sort((a, b) => {
      const statA = fs.statSync(path.join(BACKUP_CONFIG.BACKUP_DIR, a));
      const statB = fs.statSync(path.join(BACKUP_CONFIG.BACKUP_DIR, b));
      return statB.mtime - statA.mtime;
    }).reverse();

    // Manter apenas os mais recentes
    const filesToDelete = backupFiles.slice(BACKUP_CONFIG.MAX_BACKUPS);
    
    filesToDelete.forEach(file => {
      const filePath = path.join(BACKUP_CONFIG.BACKUP_DIR, file);
      fs.unlinkSync(filePath);
      console.log('🗑️ Backup antigo removido:', file);
    });

    console.log(`🧹 Limpeza concluída. ${filesToDelete.length} backups antigos removidos.`);
  } catch (error) {
    console.error('❌ Erro ao limpar backups antigos:', error);
  }
};

// Criar backup do banco de dados
const createBackup = async () => {
  try {
    throw new Error('Backup automático por arquivo local (.db) está desativado. Para Supabase/Postgres, use o backup/export do próprio Supabase.');
    cleanOldBackups();

    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .slice(0, 19); // YYYY-MM-DD-HH-MM-SS

    const backupFileName = `${BACKUP_CONFIG.BACKUP_PREFIX}${timestamp}.db`;
    const backupPath = path.join(BACKUP_CONFIG.BACKUP_DIR, backupFileName);
    
    console.log('🔄 Iniciando backup...');
    console.log('📍 Arquivo de origem:', BACKUP_CONFIG.DATABASE_PATH);
    console.log('📍 Arquivo de destino:', backupPath);

    // Copiar arquivo do banco
    fs.copyFileSync(BACKUP_CONFIG.DATABASE_PATH, backupPath);
    
    // Compactar backups antigos se configurado
    if (BACKUP_CONFIG.COMPRESS) {
      const files = fs.readdirSync(BACKUP_CONFIG.BACKUP_DIR);
      const dbFiles = files.filter(file => file.endsWith('.db'));
      
      // Compactar todos exceto o mais recente
      const filesToCompress = dbFiles.slice(1);
      
      if (filesToCompress.length > 0) {
        const archiver = require('archiver');
        const output = fs.createWriteStream(
          path.join(BACKUP_CONFIG.BACKUP_DIR, `${BACKUP_CONFIG.BACKUP_PREFIX}${timestamp}.zip`)
        );

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
          console.error('❌ Erro ao compactar backups:', err);
        });

        archive.on('finish', () => {
          console.log('📦 Backups antigos compactados com sucesso');
        });

        // Adicionar arquivos ao ZIP
        filesToCompress.forEach(file => {
          const filePath = path.join(BACKUP_CONFIG.BACKUP_DIR, file);
          archive.file(fs.readFileSync(filePath), { name: file });
        });

        archive.finalize();
      }
    }

    // Obter estatísticas do backup
    const stats = fs.statSync(backupPath);
    const originalStats = fs.statSync(BACKUP_CONFIG.DATABASE_PATH);
    
    console.log('✅ Backup criado com sucesso!');
    console.log('📊 Estatísticas:');
    console.log(`   📁 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📅 Criado em: ${stats.mtime.toLocaleString('pt-BR')}`);
    console.log(`   📄 Original: ${(originalStats.size / 1024 / 1024).toFixed(2)} MB`);

    return {
      success: true,
      fileName: backupFileName,
      size: stats.size,
      createdAt: stats.mtime,
      path: backupPath
    };

  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Restaurar backup
const restoreBackup = async (backupFileName) => {
  throw new Error('Restore por arquivo local (.db) está desativado para Supabase/Postgres.');
  try {
    const backupPath = path.join(BACKUP_CONFIG.BACKUP_DIR, backupFileName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup ${backupFileName} não encontrado`);
    }

    console.log('🔄 Iniciando restauração...');
    console.log('📍 Backup:', backupPath);
    console.log('📍 Destino:', BACKUP_CONFIG.DATABASE_PATH);

    // Fazer backup do arquivo atual antes de restaurar
    const currentBackup = await createBackup();
    
    if (!currentBackup.success) {
      throw new Error('Não foi possível fazer backup do arquivo atual');
    }

    // Restaurar backup
    fs.copyFileSync(backupPath, BACKUP_CONFIG.DATABASE_PATH);
    
    console.log('✅ Backup restaurado com sucesso!');
    console.log(`📅 Backup de: ${new Date(backupFileName.match(/\d{4}-\d{2}-\d{2}/)[0]).toLocaleString('pt-BR')}`);
    
    return { success: true, restoredBackup: backupFileName };

  } catch (error) {
    console.error('❌ Erro ao restaurar backup:', error);
    return { success: false, error: error.message };
  }
};

// Listar backups disponíveis
const listBackups = () => {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_CONFIG.BACKUP_DIR);
    const backupFiles = files.filter(file => 
      file.startsWith(BACKUP_CONFIG.BACKUP_PREFIX) && file.endsWith('.db')
    );

    const backups = backupFiles.map(file => {
      const filePath = path.join(BACKUP_CONFIG.BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      return {
        fileName: file,
        size: (stats.size / 1024 / 1024).toFixed(2),
        createdAt: stats.mtime,
        path: filePath
      };
    });

    // Ordenar por data (mais recente primeiro)
    backups.sort((a, b) => b.createdAt - a.createdAt);

    return backups;

  } catch (error) {
    console.error('❌ Erro ao listar backups:', error);
    return [];
  }
};

// Executar backup
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'create':
      createBackup();
      break;
      
    case 'restore':
      const backupName = process.argv[3];
      if (!backupName) {
        console.error('❌ Nome do backup não fornecido');
        console.log('Uso: node backup.js restore <nome_do_backup.db>');
        process.exit(1);
      }
      restoreBackup(backupName);
      break;
      
    case 'list':
      const backups = listBackups();
      console.log('\n📋 Backups disponíveis:');
      console.log('=====================================');
      backups.forEach((backup, index) => {
        console.log(`${index + 1}. ${backup.fileName}`);
        console.log(`   📅 ${backup.createdAt.toLocaleString('pt-BR')}`);
        console.log(`   📊 ${backup.size} MB`);
        console.log('');
      });
      break;
      
    default:
      console.log('🔧 Sistema de Backup - Banca no Ponto');
      console.log('=====================================');
      console.log('Comandos disponíveis:');
      console.log('  create    - Criar novo backup');
      console.log('  restore  - Restaurar backup existente');
      console.log('  list     - Listar backups disponíveis');
      console.log('');
      console.log('Uso: node backup.js <comando> [argumentos]');
      break;
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  BACKUP_CONFIG
};
