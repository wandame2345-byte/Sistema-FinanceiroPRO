import { getExpensesByCategory, getTransactionsByUser, findCategoryByName } from '../../transactions/service';
import { formatCurrency, formatDate } from '../../../shared/utils/format-currency';
export async function handleGastos(userId: string, categoryArg?: string): Promise<string> {
if (categoryArg) {
const category = await findCategoryByName(categoryArg.toLowerCase());
if (!category) return `❌ Categoria "${categoryArg}" não encontrada.`;
const transactions = await getTransactionsByUser(userId, { categoryId: category.id, type: 'expense' });
if (transactions.length === 0) return `📭 Nenhum gasto em *${category.name}*.`;
const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
let msg = `📊 *GASTOS - ${category.name.toUpperCase()}*\n`;
for (const t of transactions.slice(0, 10)) msg += `• ${formatDate(t.date)} - ${t.description}: ${formatCurrency(t.amount)}\n`;
msg += `\n💰 *Total: ${formatCurrency(total)}*`;
return msg;
}
const byCategory = await getExpensesByCategory(userId);
if (byCategory.length === 0) return '📭 Nenhum gasto este mês.';
const total = byCategory.reduce((sum, c) => sum + c.total, 0);
let msg = `📊 *GASTOS DO MÊS*\n`;
for (const c of byCategory) msg += `${c.category}: ${formatCurrency(c.total)} (${((c.total/total)*100).toFixed(1)}%)\n`;
msg += `\n💰 *Total: ${formatCurrency(total)}*`;
return msg;
}
