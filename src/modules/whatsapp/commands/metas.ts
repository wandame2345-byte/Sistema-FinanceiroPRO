import { getGoals } from '../../goals/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleMetas(userId: string): Promise<string> {
const goals = await getGoals(userId);
if (goals.length === 0) return '🎯 Nenhuma meta cadastrada.';
let msg = `🎯 *METAS*\n`;
for (const g of goals.filter(g => g.isActive).slice(0, 5)) {
msg += `• ${g.name}: ${g.percentComplete.toFixed(0)}% (${formatCurrency(g.savedAmount)}/${formatCurrency(g.targetAmount)})\n`;
}
return msg;
}
