import { getInstallments, getInstallmentsDueSoon } from '../../installments/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
export async function handleParcelas(userId: string): Promise<string> {
const installments = await getInstallments(userId);
if (installments.length === 0) return '📭 Nenhuma parcela ativa.';
let msg = `📦 *PARCELAS ATIVAS*\n`;
for (const i of installments.slice(0, 5)) {
msg += `• ${i.description} (${i.currentParcel}/${i.totalParcels}): ${formatCurrency(i.parcelValue)}/mês\n`;
}
return msg;
}
