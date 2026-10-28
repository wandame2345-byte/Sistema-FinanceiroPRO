import { createTransaction, findCategoryByName } from '../../transactions/service';
import { checkBudgetAlert } from '../../budgets/service';
import { formatCurrency } from '../../../shared/utils/format-currency';
import { parseAmount } from '../../../shared/utils/parse-command';
export async function handleAdicionar(userId: string, args: string[]): Promise<string> {
if (args.length < 2) return `❌ Use: /adicionar [valor] [categoria] [descrição]\nEx: /adicionar 50 mercado compra`;
const amount = parseAmount(args[0]);
if (amount === null || amount <= 0) return '❌ Valor inválido.';
const category = await findCategoryByName(args[1].toLowerCase());
if (!category) return `❌ Categoria "${args[1]}" não encontrada.\nDisponíveis: mercado, transporte, lazer, saúde, educação, moradia, vestuário, assinaturas, outros`;
const description = args.slice(2).join(' ') || 'Sem descrição';
await createTransaction({ userId, amount, description, type: 'expense', categoryId: category.id });
let msg = `✅ *GASTO REGISTRADO*\n💰 ${formatCurrency(amount)}\n📁 ${category.name}\n📝 ${description}`;
const alert = await checkBudgetAlert(userId, category.id);
if (alert && alert.alertLevel !== 'ok') {
if (alert.alertLevel === 'exceeded') msg += `\n🔴 *LIMITE EXCEDIDO!*`;
else if (alert.alertLevel === 'critical') msg += `\n🔶 *ALERTA:* ${alert.percentUsed.toFixed(0)}% usado`;
else msg += `\n⚠️ *Atenção:* ${alert.percentUsed.toFixed(0)}% usado`;
}
return msg;
}
