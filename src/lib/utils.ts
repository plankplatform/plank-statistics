import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ChartModel } from 'ag-grid-community';

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

/**
 * Converte in numeri i valori della colonna, ignorando valori non number
 * 
 * @param columns Elenco delle colonne
 * @param rows Elenco con i dati da modificare
 * @returns Array di righe con i valori numerici convertiti
 */
export function castNumericValues(columns: string[], rows: Record<string, any>[]) {
  return rows.map((row) => {
    const newRow = { ...row };
    columns.forEach((col) => {
      const val = row[col];
      if (val !== null && val !== '' && !isNaN(val)) {
        newRow[col] = Number(val);
      }
    });

    return newRow;
  });
}

/**
 * Normalizza la configurazione di un modello grafico Ag Grid
 * 
 * @param model Modello del grafico da normalizzare
 * @returns Modello normalizzato
 */
export function normalizeChartOptions(model: ChartModel): ChartModel {
  if (Array.isArray(model.chartOptions)) {
    model.chartOptions = {};
  }

  return model;
}

/**
 * Crea copia (deep) di un JSON
 * 
 * @param value valore da clonare (json)
 * @returns nuova istanza copia esatta di value
 */
export function deepClone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch (error) {
    console.error("Errore durante la copia", error)
    return value;
  }
}

/**
 * Normalizza la stringa corrispondente al titolo della colonna: primo carattere maiuscolo e rimozione di _/-
 * @param text Titolo della colonna
 * @returns Titolo della colonna normalizzato
 */
export function normalizeCol(text: string): string {
  const cleaned = text.replace(/[_-]/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}