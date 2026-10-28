import { getBudgetStatus } from '../../budgets/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleOrcamento(userId: string): Promise<string> {
const budgets = await getBudgetStatus(userId);
if (budgets.length === 0) return '📊 Nenhum orçamento configurado.';
let msg = `📊 *ORÇAMENTO*\n`;
for (const b of budgets) {
const icon = b.alertLevel === 'exceeded' ? '🔴' : b.alertLevel === 'critical' ? '🔶' : b.alertLevel === 'warning' ? '️' : '✅';
msg += `${icon} ${b.category}: ${formatCurrency(b.spent)}/${formatCurrency(b.limit)} (${b.percentUsed.toFixed(0)}%)\n`;
}
return msg;
}
