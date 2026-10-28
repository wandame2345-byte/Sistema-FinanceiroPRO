import makeWASocket, { useMultiFileAuthState, DisconnectReason, WASocket, proto, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import path from 'path';
import pino from 'pino';
import qrcode from 'qrcode';
import { env } from '../../config/env';
import fs from 'fs';

let sock: WASocket | null = null;
let currentQR: string | null = null;

export function getCurrentQR(): string | null {
  return currentQR;
}

export async function createWhatsAppClient(onMessage: (msg: proto.IWebMessageInfo, sock: WASocket) => Promise<void>): Promise<WASocket> {
  const sessionPath = path.resolve(env.WHATSAPP_SESSION_PATH);
  
  // Garante que a pasta existe
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
    browser: ['Finance WhatsApp', 'Chrome', '1.0.0']
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Novo QR Code gerado!');
      // Salva o QR como string para a rota /qr usar
      currentQR = qr;
      // Tenta gerar um buffer base64 para logs se necessário
      try {
        const qrImage = await qrcode.toDataURL(qr);
        console.log('QR Code disponível em /qr');
      } catch (e) {
        console.error('Erro ao gerar QR image:', e);
      }
    }

    if (connection === 'close') {
      currentQR = null;
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('🔄 Reconectando...');
        setTimeout(() => createWhatsAppClient(onMessage), 5000);
      } else {
        console.log('❌ Desconectado pelo usuário.');
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp conectado!');
      currentQR = null; // Limpa o QR pois já conectou
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.key.fromMe) await onMessage(msg, sock!);
    }
  });

  return sock;
}

export async function sendMessage(jid: string, text: string): Promise<void> {
  if (sock) await sock.sendMessage(jid, { text });
}
