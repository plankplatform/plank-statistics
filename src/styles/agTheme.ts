import { themeQuartz, iconSetMaterial } from 'ag-grid-community';

export const myTheme = themeQuartz.withPart(iconSetMaterial).withParams({
  backgroundColor: '#ffffff',
  browserColorScheme: 'light',

  // testo
  cellTextColor: '#1a1a1a',
  headerTextColor: '#1a1a1a',
  fontFamily: 'Roboto, sans-serif',
  headerFontSize: 14,
  headerFontWeight: 500,

  // header grigio chiaro come lo screen
  headerBackgroundColor: '#f0f0f0',

  // righe alternate
  oddRowBackgroundColor: '#fafafa',

  // rimuove i bordi e padding minimal
  columnBorder: false,
  rowBorder: false,
  sidePanelBorder: false,
  wrapperBorder: false,

  // rimuove smussature
  borderRadius: 0,
  wrapperBorderRadius: 0,

  // spacing sobrio
  spacing: 8,
});
