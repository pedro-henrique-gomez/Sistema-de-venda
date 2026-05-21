const cron = require('node-cron');
const { createBackup } = require('./backup');
const path = require('path');

// Configurações do agendador
const SCHEDULER_CONFIG = {
  BACKUP_DAILY: '0 2 * * * *', // Todo dia às 02:00
  BACKUP_WEEKLY: '0 3 * * 0', // Todo domingo às 03:00
  CLEANUP_WEEKLY: '0 4 * * 0' // Todo domingo às 04:00
};

// Agendar backup diário (desativado para Supabase/Postgres gerenciado)
const dailyBackup = cron.schedule(SCHEDULER_CONFIG.BACKUP_DAILY, () => {
  console.log('⏸️ Backup automático desativado para Supabase (Postgres gerenciado).');
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

// Agendar backup semanal
const weeklyBackup = cron.schedule(SCHEDULER_CONFIG.BACKUP_WEEKLY, () => {
  console.log('🗓️ Iniciando backup semanal automático...');
  
  const backup = createBackup();
  
  if (backup.success) {
    console.log('✅ Backup semanal concluído:', backup.fileName);
    console.log(`📊 Tamanho: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.error('❌ Falha no backup semanal:', backup.error);
  }
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

// Limpeza semanal de backups antigos
const weeklyCleanup = cron.schedule(SCHEDULER_CONFIG.CLEANUP_WEEKLY, () => {
  console.log('🧹 Iniciando limpeza semanal de backups...');
  
  const { listBackups, BACKUP_CONFIG } = require('./backup');
  const backups = listBackups();
  
  // Manter apenas últimos 7 backups
  if (backups.length > BACKUP_CONFIG.MAX_BACKUPS) {
    const backupsToDelete = backups.slice(BACKUP_CONFIG.MAX_BACKUPS);
    
    backupsToDelete.forEach(backup => {
      const fs = require('fs');
      try {
        fs.unlinkSync(backup.path);
        console.log('🗑️ Backup antigo removido:', backup.fileName);
      } catch (error) {
        console.error('❌ Erro ao remover backup antigo:', error);
      }
    });
    
    console.log(`🧹 Limpeza concluída. ${backupsToDelete.length} backups antigos removidos.`);
  } else {
    console.log('📁 Nenhum backup antigo para remover.');
  }
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

console.log(`
⏰ SISTEMA DE AGENDAMENTO - BANCA NO PONTO
========================================
🕐 Backup Diário: ${SCHEDULER_CONFIG.BACKUP_DAILY}
📅 Backup Semanal: ${SCHEDULER_CONFIG.BACKUP_WEEKLY}
🧹 Limpeza Semanal: ${SCHEDULER_CONFIG.CLEANUP_WEEKLY}
🌍 Fuso Horário: America/Sao_Paulo
📁 Logs: Console
⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}
========================================
`);

console.log('📋 Comandos disponíveis:');
console.log('  backup.js create    - Criar backup manual');
console.log('  backup.js restore   - Restaurar backup');
console.log('  backup.js list     - Listar backups');
console.log('  scheduler.js         - Iniciar agendador de backups');
console.log('');

// Tratamento de encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando agendador de backups...');
  
  // Parar todos os jobs agendados
  dailyBackup.stop();
  weeklyBackup.stop();
  weeklyCleanup.stop();
  
  console.log('✅ Todos os agendamentos parados.');
  process.exit(0);
});

// Tratamento de encerramento forçado
process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando agendador de backups (SIGTERM)...');
  
  dailyBackup.stop();
  weeklyBackup.stop();
  weeklyCleanup.stop();
  
  process.exit(0);
});
