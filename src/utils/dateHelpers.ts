import { format, addMonths } from 'date-fns';

/**
 * Generates dynamic fiscal months list from 6 months in the past to 6 months in the future.
 */
export function getFiscalMonthsRange(): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = [];
  const currentDate = new Date(); // Centered around today's current date
  
  const ptMonths = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  for (let i = -6; i <= 6; i++) {
    const targetDate = addMonths(currentDate, i);
    const value = format(targetDate, 'yyyy-MM');
    const monthIndex = targetDate.getMonth();
    const year = targetDate.getFullYear();
    const label = `${ptMonths[monthIndex]} ${year}`;
    months.push({ value, label });
  }

  return months;
}

/**
 * Helper to display month key (e.g., "2026-06") as Portuguese text
 */
export function formatMonthToPT(monthKey: string): string {
  try {
    const ptMonths = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const [yearStr, monthStr] = monthKey.split('-');
    const monthIndex = parseInt(monthStr, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${ptMonths[monthIndex]} ${yearStr}`;
    }
  } catch {}
  return monthKey;
}
