import { useEffect, useRef } from 'react';
import { AgGridReact as AgGrid } from 'ag-grid-react';
import type { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi } from 'ag-grid-community';
import { ChartModel } from 'ag-grid-community';

interface StatChartsProps {
  model: ChartModel;
  data: Record<string, any>[];
  columns: string[];
}

const StatCharts = ({ model, data, columns }: StatChartsProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colDefs: ColDef[] = columns.map((col) => {
    const firstValue = data.find((row) => row[col] !== undefined && row[col] !== null)?.[col];
    const isNumeric = typeof firstValue === 'number';

    return {
      field: col,
      filter: isNumeric ? 'agNumberColumnFilter' : 'agTextColumnFilter',
      type: isNumeric ? 'numericColumn' : undefined,
      chartDataType: isNumeric ? 'series' : 'category',
    };
  });

  useEffect(() => {
    const gridApi: GridApi | undefined = gridRef.current?.api;
    const container = containerRef.current;

    if (!gridApi || !container) return;

    container.innerHTML = '';

    const interval = setInterval(() => {
      if (gridApi.getDisplayedRowCount() > 0) {
        clearInterval(interval);
        const chartRef = gridApi.restoreChart(model, container);
        if (!chartRef) {
          console.warn('Impossibile ricreare il grafico');
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [model, data, columns]);

  return (
    <div className="border rounded p-4 bg-white">
      <div style={{ display: 'none' }}>
        <div className="ag-theme-alpine" style={{ height: 1, width: 1 }}>
          <AgGrid
            ref={gridRef}
            rowData={data}
            columnDefs={colDefs}
            suppressPaginationPanel
            suppressMovableColumns
            suppressMenuHide
            suppressScrollOnNewData
            rowSelection="multiple"
            suppressCellFocus
          />
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default StatCharts;
