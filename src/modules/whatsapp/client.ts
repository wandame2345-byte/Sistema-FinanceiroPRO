import makeWASocket, { useMultiFileAuthState, DisconnectReason, WASocket, proto, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import path from 'path';
import pino from 'pino';
import { env } from '../../config/env';
import fs from 'fs';
import qrcode from 'qrcode-terminal';

let sock: WASocket | null = null;

export async function createWhatsAppClient(onMessage: (msg: proto.IWebMessageInfo, sock: WASocket) => Promise<void>) {
  const sessionPath = path.resolve(env.WHATSAPP_SESSION_PATH);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Finance WhatsApp', 'Chrome', '1.0.0'],
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('\n📱 ESCANEIE O QR CODE ABAIXO:\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) setTimeout(() => createWhatsAppClient(onMessage), 5000);
    } else if (connection === 'open') {
      console.log('✅ WhatsApp conectado!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      try {
        await onMessage(msg, sock!);
      } catch (err) {
        console.error('Erro ao processar msg:', err);
      }
    }
  });

  return sock;
}

export async function sendMessage(jid: string, text: string) {
  if (sock) await sock.sendMessage(jid, { text });
}
