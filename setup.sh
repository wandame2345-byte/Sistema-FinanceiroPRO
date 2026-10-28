#!/bin/bash
echo "Criando estrutura de pastas..."
mkdir -p src/config src/modules/whatsapp/commands src/modules/transactions src/modules/installments src/modules/goals src/modules/investments src/modules/budgets src/jobs src/shared/utils prisma

echo "Criando package.json..."
cat > package.json << 'EOP'
{
  "name": "sistema-financeiro-pro",
  "version": "1.0.0",
  "main": "dist/app.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/rate-limit": "^9.1.0",
    "@prisma/client": "^5.22.0",
    "@whiskeysockets/baileys": "^6.7.8",
    "date-fns": "^3.6.0",
    "dotenv": "^16.4.5",
    "fastify": "^4.28.1",
    "node-cron": "^3.0.3",
    "pino": "^9.4.0",
    "pino-pretty": "^11.2.2",
    "qrcode-terminal": "^0.12.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/node-cron": "^3.0.11",
    "@types/qrcode-terminal": "^0.12.2",
    "prisma": "^5.22.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.3"
  },
  "prisma": { "seed": "ts-node prisma/seed.ts" }
}
EOP

echo "Criando tsconfig.json..."
cat > tsconfig.json << 'EOP'
{
  "compilerOptions": {
    "target": "ES2022", "module": "commonjs", "outDir": "./dist", "rootDir": "./src",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true, "resolveJsonModule": true
  },
  "include": ["src/**/*"], "exclude": ["node_modules", "dist"]
}
EOP

echo "Criando .env..."
cat > .env << 'EOP'
DATABASE_URL="postgresql://neondb_owner:npg_9AMBKLTOxfq4@ep-twilight-fire-b54tqzxo-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
WHATSAPP_SESSION_PATH="./whatsapp-session"
TZ="America/Sao_Paulo"
PORT=3000
NODE_ENV="development"
ALERT_HIGH_VALUE_THRESHOLD=100
DAILY_SUMMARY_HOUR=20
EOP

echo "Criando .gitignore..."
cat > .gitignore << 'EOP'
node_modules/
dist/
.env
whatsapp-session/
*.log
EOP

echo "Criando prisma/schema.prisma..."
cat > prisma/schema.prisma << 'EOP'
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model User {
  id String @id @default(uuid())
  phone String @unique
  name String
  currency String @default("BRL")
  dailySummaryTime String @default("20:00")
  alertThreshold Decimal @default(100) @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  transactions Transaction[]
  installments Installment[]
  goals Goal[]
  investments Investment[]
  budgets Budget[]
}

model Category {
  id String @id @default(uuid())
  name String @unique
  color String @default("#64748b")
  transactions Transaction[]
  budgets Budget[]
}

model Transaction {
  id String @id @default(uuid())
  userId String
  categoryId String?
  amount Decimal @db.Decimal(10, 2)
  description String
  date DateTime @default(now())
  type String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id])
  installmentId String?
  installment Installment? @relation(fields: [installmentId], references: [id])
  @@index([userId])
}

model Installment {
  id String @id @default(uuid())
  userId String
  description String
  totalAmount Decimal @db.Decimal(10, 2)
  totalParcels Int
  currentParcel Int @default(1)
  dueDay Int
  startDate DateTime
  endDate DateTime
  isCompleted Boolean @default(false)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  @@index([userId])
}

model Goal {
  id String @id @default(uuid())
  userId String
  name String
  category String?
  targetAmount Decimal @db.Decimal(10, 2)
  savedAmount Decimal @default(0) @db.Decimal(10, 2)
  deadline DateTime
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model Investment {
  id String @id @default(uuid())
  userId String
  type String
  name String
  amount Decimal @db.Decimal(10, 2)
  yieldRate Decimal? @db.Decimal(5, 4)
  maturityDate DateTime?
  lastUpdate DateTime @default(now())
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model Budget {
  id String @id @default(uuid())
  userId String
  categoryId String
  monthLimit Decimal @db.Decimal(10, 2)
  rollover Boolean @default(false)
  month String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id])
  @@unique([userId, categoryId, month])
  @@index([userId])
}
EOP

echo "Estrutura base criada! Agora rode: bash setup_part2.sh"
