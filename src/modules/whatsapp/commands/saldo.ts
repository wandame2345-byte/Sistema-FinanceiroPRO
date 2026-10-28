import { getBalance, getTodayExpenses } from '../../transactions/service';
import { getMonthlyInstallmentTotal } from '../../installments/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleSaldo(userId: string): Promise<string> {
const balance = await getBalance(userId);
const todayExpenses = await getTodayExpenses(userId);
const monthlyInstallments = await getMonthlyInstallmentTotal(userId);
const todayTotal = todayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
let msg = `💰 *SALDO ATUAL*\n`;
msg += `📊 Receitas: ${formatCurrency(balance.income)}\n`;
msg += `📉 Despesas: ${formatCurrency(balance.expense)}\n`;
msg += `💵 *Saldo: ${formatCurrency(balance.balance)}*\n`;
msg += `📅 Gastos hoje: ${formatCurrency(todayTotal)}\n`;
msg += `📦 Parcelas/mês: ${formatCurrency(monthlyInstallments)}`;
return msg;
}
