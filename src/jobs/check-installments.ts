import { prisma } from '../config/database';
import { getInstallmentsDueSoon } from '../modules/installments/service';
import { sendMessage } from '../modules/whatsapp/client';
import { formatCurrency } from '../shared/utils/format-currency';
export async function checkInstallments(): Promise<void> {
const users = await prisma.user.findMany();
for (const user of users) {
const due = await getInstallmentsDueSoon(user.id, 3);
if (due.length > 0) {
let msg = `⚠️ *PARCELAS VENCENDO*\n`;
due.forEach(i => msg += `• ${i.description}: ${formatCurrency(i.parcelValue)} (${i.daysUntilDue} dias)\n`);
await sendMessage(`${user.phone}@s.whatsapp.net`, msg);
}
}
}
