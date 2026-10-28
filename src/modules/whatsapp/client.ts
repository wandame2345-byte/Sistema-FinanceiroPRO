import makeWASocket, { useMultiFileAuthState, DisconnectReason, WASocket, proto, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import path from 'path';
import pino from 'pino';
import { env } from '../../config/env';
import fs from 'fs';

let sock: WASocket | null = null;
let currentQR: string | null = null;

export function getCurrentQR(): string | null {
  return currentQR;
}

export async function createWhatsAppClient(onMessage: (msg: proto.IWebMessageInfo, sock: WASocket) => Promise<void>): Promise<WASocket> {
  const sessionPath = path.resolve(env.WHATSAPP_SESSION_PATH);
  
  // Garante que a pasta existe para salvar a sessão
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Finance WhatsApp', 'Chrome', '1.0.0'],
    // Importante para manter a conexão viva no Render Free
    generateHighQualityLinkPreview: true 
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Novo QR Code gerado! Acesse /qr no navegador.');
      currentQR = qr;
    }

    if (connection === 'close') {
      currentQR = null;
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('🔄 Conexão perdida. Reconectando em 5 segundos...');
        setTimeout(() => createWhatsAppClient(onMessage), 5000);
      } else {
        console.log('❌ Desconectado pelo usuário (Logout).');
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp conectado com sucesso! Sessão salva.');
      currentQR = null; // Limpa o QR pois já conectou
    }
  });

  // Salva as credenciais sempre que mudarem (isso mantém você logado)
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      
      // Log para debugar se a mensagem chegou
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      console.log(`📩 Mensagem recebida de ${msg.key.remoteJid}: ${text}`);
      
      try {
        await onMessage(msg, sock!);
      } catch (err) {
        console.error('Erro ao processar mensagem:', err);
      }
    }
  });

  return sock;
}

export async function sendMessage(jid: string, text: string): Promise<void> {
  if (sock) {
    await sock.sendMessage(jid, { text });
    console.log(`📤 Mensagem enviada para ${jid}`);
  }
}
