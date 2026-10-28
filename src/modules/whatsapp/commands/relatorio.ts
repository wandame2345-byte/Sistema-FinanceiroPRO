import { getBalance } from '../../transactions/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleRelatorio(userId: string): Promise<string> {
const balance = await getBalance(userId);
return `📊 *RELATÓRIO RÁPIDO*\n💰 Saldo: ${formatCurrency(balance.balance)}\n📈 Receitas: ${formatCurrency(balance.income)}\n📉 Despesas: ${formatCurrency(balance.expense)}`;
}
