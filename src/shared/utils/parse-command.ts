export function parseCommand(text: string) {
  const parts = text.trim().split(/\s+/);
  return { command: parts[0].toLowerCase(), args: parts.slice(1) };
}
export function parseAmount(val: string) {
  const num = parseFloat(val.replace(',', '.'));
  return isNaN(num) ? null : num;
}
export function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
