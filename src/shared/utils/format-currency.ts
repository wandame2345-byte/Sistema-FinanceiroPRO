export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
