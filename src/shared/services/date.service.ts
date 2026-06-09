import { 
  parse, 
  getDaysInMonth, 
  format, 
  isSameMonth, 
  isAfter, 
  isBefore,
  addDays
} from 'date-fns';

export const HOLIDAYS_2026 = [
  '2026-01-01', // Ano Novo
  '2026-01-20', // São Sebastião (RJ)
  '2026-02-16', // Carnaval (Pre-festividades)
  '2026-02-17', // Carnaval (Terça-feira de Carnaval)
  '2026-04-03', // Sexta-feira Santa
  '2026-04-21', // Tiradentes
  '2026-04-23', // São Jorge (RJ)
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
  '2026-09-07', // Independência
  '2026-10-12', // Nossa Senhora Aparecida
  '2026-11-02', // Finados
  '2026-11-15', // Proclamação da República
  '2026-11-20', // Consciência Negra
  '2026-12-25', // Natal
];

export const DateService = {
  /**
   * Safe formatter for Brazilian Portuguese display (DD/MM/YYYY)
   */
  formatToBR(dateString: string): string {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString + 'T12:00:00');
      return format(d, 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  },

  /**
   * Helper to get start and end dates of a month key "YYYY-MM"
   */
  getMonthBounds(monthKey: string) {
    try {
      const parsedDate = parse(monthKey, 'yyyy-MM', new Date());
      const totalDays = getDaysInMonth(parsedDate);
      const startStr = `${monthKey}-01`;
      const endStr = `${monthKey}-${String(totalDays).padStart(2, '0')}`;
      return {
        startDate: startStr,
        endDate: endStr,
        totalDays,
        parsedDate
      };
    } catch (e) {
      return {
        startDate: `${monthKey}-01`,
        endDate: `${monthKey}-31`,
        totalDays: 31,
        parsedDate: new Date()
      };
    }
  },

  /**
   * Determines elapsed days depending on the selected monthly scope
   * against the current operational baseline: May 27, 2026.
   * If selected month is in the past: all days elapsed.
   * If selected month is in the future: 0 days elapsed.
   * If selected month is current: 27 days.
   */
  getElapsedDays(monthKey: string): { elapsedDays: number; totalDays: number } {
    try {
      const parsedMonth = parse(monthKey, 'yyyy-MM', new Date());
      const totalDays = getDaysInMonth(parsedMonth);

      // Dynamic baseline: always the actual current date
      const today = new Date();
      const baselineYear = today.getFullYear();
      const baselineMonth = today.getMonth() + 1; // 1-indexed
      const baselineDay = today.getDate();

      const [year, month] = monthKey.split('-').map(Number);

      if (year < baselineYear || (year === baselineYear && month < baselineMonth)) {
        // Past month: 100% elapsed
        return { elapsedDays: totalDays, totalDays };
      } else if (year > baselineYear || (year === baselineYear && month > baselineMonth)) {
        // Future month: 0% elapsed
        return { elapsedDays: 0, totalDays };
      } else {
        // Current month: calculate up to and including baselineDay
        return { elapsedDays: Math.min(baselineDay, totalDays), totalDays };
      }
    } catch (e) {
      return { elapsedDays: new Date().getDate(), totalDays: 30 };
    }
  },

  /**
   * Determines elapsed business days depending on the selected monthly scope
   * against the current dynamic baseline.
   * Business days are Monday through Friday, excluding national and regional RJ holidays.
   */
  getElapsedBusinessDays(monthKey: string): { elapsedBusinessDays: number; totalBusinessDays: number } {
    try {
      const [year, month] = monthKey.split('-').map(Number);
      
      // Calculate total business days in the month (excluding weekends and holidays)
      let totalBusinessDays = 0;
      const parsedMonth = parse(monthKey, 'yyyy-MM', new Date());
      const daysInMonth = getDaysInMonth(parsedMonth);
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        const dayOfWeek = d.getDay();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !HOLIDAYS_2026.includes(dateStr)) {
          totalBusinessDays++;
        }
      }

      // Dynamic baseline: always the actual current date
      const today = new Date();
      const baselineYear = today.getFullYear();
      const baselineMonth = today.getMonth() + 1; // 1-indexed
      const baselineDay = today.getDate();

      if (year < baselineYear || (year === baselineYear && month < baselineMonth)) {
        // Past month: 100% elapsed
        return { elapsedBusinessDays: totalBusinessDays, totalBusinessDays };
      } else if (year > baselineYear || (year === baselineYear && month > baselineMonth)) {
        // Future month: 0% elapsed
        return { elapsedBusinessDays: 0, totalBusinessDays };
      } else {
        // Current month: calculate elapsed business days up to and including baselineDay
        let elapsedBusinessDays = 0;
        const upperDayLimit = Math.min(baselineDay, daysInMonth);
        for (let day = 1; day <= upperDayLimit; day++) {
          const d = new Date(year, month - 1, day);
          const dayOfWeek = d.getDay();
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          if (dayOfWeek !== 0 && dayOfWeek !== 6 && !HOLIDAYS_2026.includes(dateStr)) {
            elapsedBusinessDays++;
          }
        }
        return { elapsedBusinessDays, totalBusinessDays };
      }
    } catch (e) {
      return { elapsedBusinessDays: 15, totalBusinessDays: 20 }; // Fallback values
    }
  },

  /**
   * Add exactly 30 days to a start date and return in standard ISO format "YYYY-MM-DD"
   */
  calculateEndPeriod(startDateStr: string): string {
    try {
      const d = parse(startDateStr, 'yyyy-MM-dd', new Date());
      const newD = addDays(d, 30);
      return format(newD, 'yyyy-MM-dd');
    } catch {
      return startDateStr;
    }
  }
};
