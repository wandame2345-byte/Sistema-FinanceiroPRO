import { prisma } from '../config/database';
import { getBalance, getTodayExpenses } from '../modules/transactions/service';
import { sendMessage } from '../modules/whatsapp/client';
import { formatCurrency, formatDate } from '../shared/utils/format-currency';
export async function sendDailySummary(): Promise<void> {
const users = await prisma.user.findMany();
for (const user of users) {
try {
const balance = await getBalance(user.id);
const today = await getTodayExpenses(user.id);
const todayTotal = today.reduce((s, t) => s + Number(t.amount), 0);
let msg = `📊 *RESUMO DIÁRIO - ${formatDate(new Date())}*\n`;
msg += `💰 *Saldo:* ${formatCurrency(balance.balance)}\n`;
msg += `📅 *Gastos Hoje:* ${formatCurrency(todayTotal)}\n`;
await sendMessage(`${user.phone}@s.whatsapp.net`, msg);
} catch (e) { console.error(e); }
}
}
