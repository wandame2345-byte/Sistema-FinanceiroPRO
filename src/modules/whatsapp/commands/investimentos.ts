import { getInvestments, getTotalPortfolio } from '../../investments/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleInvestimentos(userId: string): Promise<string> {
const investments = await getInvestments(userId);
const total = await getTotalPortfolio(userId);
if (investments.length === 0) return '📈 Nenhum investimento.';
let msg = `📈 *INVESTIMENTOS*\n💰 Total: ${formatCurrency(total)}\n`;
for (const i of investments.slice(0, 5)) msg += `• ${i.name}: ${formatCurrency(i.amount)}\n`;
return msg;
}
