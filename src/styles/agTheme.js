import { themeQuartz, iconSetMaterial } from 'ag-grid-community';

export const myTheme = themeQuartz.withPart(iconSetMaterial).withParams({
  accentColor: '#e72175',
  backgroundColor: '#ffffff',
  borderRadius: 12,
  browserColorScheme: 'light',
  cellTextColor: '#000000',
  columnBorder: false,
  fontFamily: 'Roboto, sans-serif',
  foregroundColor: '#2d2e83',
  headerBackgroundColor: '#2d2e83',
  headerFontSize: 14,
  headerFontWeight: 600,
  headerTextColor: '#ffffff',
  oddRowBackgroundColor: '#f9f9f9',
  rowBorder: false,
  sidePanelBorder: true,
  spacing: 8,
  wrapperBorder: false,
  wrapperBorderRadius: 12,
});
