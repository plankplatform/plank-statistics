import { useRef } from 'react';
import { AgGridReact as AgGrid } from 'ag-grid-react';
import type { AgGridReact } from 'ag-grid-react';
import type { ColDef, FirstDataRenderedEvent } from 'ag-grid-community';
import { ChartModel } from 'ag-grid-community';

interface StatChartsProps {
  model: ChartModel;
  data: Record<string, any>[];
  columns: string[];
  filters?: any;
}

const StatChart = ({ model, data, columns, filters }: StatChartsProps) => {
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

  const handleFirstDataRendered = (event: FirstDataRenderedEvent) => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    if (filters && Object.keys(filters).length > 0) {
      event.api.setFilterModel(JSON.parse(filters));

      setTimeout(() => {
        const chartRef = event.api.restoreChart(model, container);
        if (!chartRef) {
          console.warn('Impossibile ricreare il grafico');
        }
      }, 100);
    } else {
      const chartRef = event.api.restoreChart(model, container);
      if (!chartRef) {
        console.warn('Impossibile ricreare il grafico');
      }
    }
  };

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
            onFirstDataRendered={handleFirstDataRendered}
          />
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default StatChart;
