import { z } from 'zod';

export const StorageService = {
  /**
   * Safe item getter with Zod validation
   */
  getValidated<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);
      // Validate schema and parse
      const result = schema.safeParse(parsed);
      if (result.success) {
        return result.data;
      } else {
        console.warn(`Validation failed for key "${key}". Reverting to fallback. Errors:`, result.error);
        return fallback;
      }
    } catch (e) {
      console.error(`Error parsing localStorage key "${key}":`, e);
      return fallback;
    }
  },

  /**
   * Generic primitive/unvalidated getter
   */
  get(key: string, fallback: string = ''): string {
    const raw = localStorage.getItem(key);
    return raw !== null ? raw : fallback;
  },

  /**
   * Safe item setter
   */
  set<T>(key: string, value: T): void {
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error(`Error writing key "${key}" to localStorage:`, e);
    }
  },

  /**
   * Item remover
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clear multiple
   */
  clearKeys(keys: string[]): void {
    keys.forEach(k => localStorage.removeItem(k));
  }
};
