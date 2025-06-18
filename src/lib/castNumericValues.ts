export function castNumericValues(columns: string[], rows: Record<string, any>[]) {
  return rows.map((row) => {
    const newRow: Record<string, any> = {};
    for (const col of columns) {
      const val = row[col];
      if (typeof val === 'string' && val.trim() !== '' && !isNaN(val as any)) {
        newRow[col] = Number(val);
      } else {
        newRow[col] = val;
      }
    }
    return newRow;
  });
}
