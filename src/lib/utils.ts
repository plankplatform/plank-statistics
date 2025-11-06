import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatta la data in DD/MM/YYYY hh:mm:ss
 * 
 * @param value Il valore contenente la data ottenutu dal fetch
 * @returns Data come stringa in formato ITA
 */
export function formatHistoryDate(value?: string | null) {
  if(!value) return null;
  const parsed = new Date(value);
  if(Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString('it-IT');
}

/**
 * Parsing in un array di chiavi relativo alle colonne (tipo stringa)
 *
 * @param value Il valore di input da analizzare (può essere un array, json, sconosciuto)
 * @param fallback L'array predefinito da restituire se l'analisi fallisce
 * @returns Un array di chiavi di colonna stringa
 */
export function parseColumnsOrder(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string'); // Ts style per controllo tipi
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch(error) {
      console.error("Unable to parse columns order from history item", error);
    }
  }

  return fallback;
}


/**
 * Parsing in un array di entry (stringa-valore) relativi alle righe json
 * 
 * @param value Valore di input da analizzare (può essere un array, json, sconosciuto)
 * @returns Array di entry (stringa-valore) corrispondente alle righe
 */
export function parseJsonRows(value: unknown): Record<string, any>[] {
  if (Array.isArray(value)) {
    return value.filter((row): row is Record<string, any> => typeof row === 'object' && row !== null);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if(Array.isArray(parsed)) {
        return parsed.filter((row): row is Record<string, any> => typeof row === 'object' && row !== null);
      }
    } catch(error) {
      console.error("Unable to parse json file from history item", error);
    }
  }

  return [];
}
