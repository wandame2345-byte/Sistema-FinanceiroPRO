import cron from 'node-cron';
import { sendDailySummary } from './send-daily-summary';
import { checkInstallments } from './check-installments';
import { checkGoals } from './check-goals';
import { env } from '../config/env';
export function startScheduler() {
cron.schedule(`0 ${env.DAILY_SUMMARY_HOUR} * * *`, () => sendDailySummary().catch(console.error), { timezone: 'America/Sao_Paulo' });
cron.schedule('0 8 * * *', () => checkInstallments().catch(console.error), { timezone: 'America/Sao_Paulo' });
cron.schedule('0 9 * * *', () => checkGoals().catch(console.error), { timezone: 'America/Sao_Paulo' });
console.log('✅ Scheduler iniciado');
}
