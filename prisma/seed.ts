import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
const categories = [
{ name: 'mercado', color: '#ef4444' }, { name: 'transporte', color: '#f97316' },
{ name: 'lazer', color: '#eab308' }, { name: 'saúde', color: '#22c55e' },
{ name: 'educação', color: '#3b82f6' }, { name: 'moradia', color: '#8b5cf6' },
{ name: 'vestuário', color: '#ec4899' }, { name: 'assinaturas', color: '#6366f1' },
{ name: 'outros', color: '#64748b' }
];
for (const cat of categories) {
await prisma.category.upsert({ where: { name: cat.name }, update: {}, create: cat });
}
console.log('✅ Categorias criadas!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
