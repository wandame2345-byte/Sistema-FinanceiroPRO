FROM node:20-alpine AS base
# Instala dependências do sistema necessárias para o Prisma (OpenSSL)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm install

COPY . .

# Gera o cliente Prisma (isso baixa o engine correto para linux-musl)
RUN npx prisma generate

# Compila o TypeScript
RUN npm run build

# --- Estágio de Produção ---
FROM node:20-alpine AS production
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
ENV NODE_ENV=production

# Copia apenas o necessário do estágio de build
COPY --from=base /app/package*.json ./
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma

EXPOSE 10000

CMD ["node", "dist/app.js"]
