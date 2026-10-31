import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const categories = [
    { name: 'Salário', color: '#22c55e', icon: 'briefcase' },
    { name: 'Mercado', color: '#ef4444', icon: 'shopping-cart' },
    { name: 'Transporte', color: '#f97316', icon: 'car' },
    { name: 'Lazer', color: '#eab308', icon: 'gamepad' },
    { name: 'Contas', color: '#64748b', icon: 'file-text' },
    { name: 'Saúde', color: '#ec4899', icon: 'heart' },
    { name: 'Educação', color: '#8b5cf6', icon: 'book' },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categorias criadas!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
