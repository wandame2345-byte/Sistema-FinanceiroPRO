import { proto, WASocket } from '@whiskeysockets/baileys';
import { parseCommand } from '../../shared/utils/parse-command';
import { findOrCreateUser } from '../transactions/service';
import { handleSaldo } from './commands/saldo';
import { handleGastos } from './commands/gastos';
import { handleParcelas } from './commands/parcelas';
import { handleMetas } from './commands/metas';
import { handleInvestimentos } from './commands/investimentos';
import { handleOrcamento } from './commands/orcamento';
import { handleAdicionar } from './commands/adicionar';
import { handleAjuda } from './commands/ajuda';
import { handleRelatorio } from './commands/relatorio';

export async function messageHandler(msg: proto.IWebMessageInfo, sock: WASocket): Promise<void> {
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const jid = msg.key.remoteJid!;

  // REGRA DE OURO: Se não começar com "/", IGNORAR TOTALMENTE.
  if (!text.trim().startsWith('/')) {
    return;
  }

  console.log(`[BOT] Comando recebido: ${text}`);

  try {
    const phone = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    const user = await findOrCreateUser(phone, msg.pushName || phone);
    const parsed = parseCommand(text);

    if (!parsed) return;

    let response = '';
    switch (parsed.command) {
      case '/ajuda': response = handleAjuda(); break;
      case '/saldo': response = await handleSaldo(user.id); break;
      case '/gastos': response = await handleGastos(user.id, parsed.args[0]); break;
      case '/adicionar': response = await handleAdicionar(user.id, parsed.args); break;
      case '/parcelas': response = await handleParcelas(user.id); break;
      case '/metas': response = await handleMetas(user.id); break;
      case '/investimentos': response = await handleInvestimentos(user.id); break;
      case '/orcamento': response = await handleOrcamento(user.id); break;
      case '/relatorio': response = await handleRelatorio(user.id, parsed.args[0]); break;
      default: response = `❓ Comando desconhecido. Digite /ajuda.`;
    }

    if (response) {
      await sock.sendMessage(jid, { text: response });
      console.log(`[BOT] Resposta enviada para ${phone}`);
    }
  } catch (error) {
    console.error('[BOT] Erro:', error);
  }
}
