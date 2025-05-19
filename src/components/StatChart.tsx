import { useRef, useState, useCallback } from 'react';
import { AgGridReact as AgGrid } from 'ag-grid-react';
import type { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  FirstDataRenderedEvent,
  GetChartMenuItemsParams,
  MenuItemDef,
} from 'ag-grid-community';
import { ChartModel } from 'ag-grid-community';
import ChartCardHeader from './ChartCardHeader';
import { apiFetch } from '@/lib/api';

interface StatChartsProps {
  model: ChartModel;
  data: Record<string, any>[];
  columns: string[];
  filters?: any;
  sorting?: any;
  chartId: number;
  title: string;
  onDelete: () => void;
}

const StatChart = ({
  model,
  data,
  columns,
  filters,
  sorting,
  chartId,
  title,
  onDelete,
}: StatChartsProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = async () => {
    const api = gridRef.current?.api;
    const models = api?.getChartModels() || [];
    if (!models.length) return;

    const updatedModel = models[models.length - 1];

    if (!api) return;

    const updatedFilters = api.getFilterModel();
    const updatedSorting = api.getColumnState();

    try {
      await apiFetch(`v1/stats/graphs/${chartId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: currentTitle,
          config: updatedModel,
          filters: updatedFilters,
          sorting: updatedSorting,
        }),
      });

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('Errore durante il salvataggio:', err);
      alert('Errore durante il salvataggio');
    }
  };

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

    if (sorting && Object.keys(sorting).length > 0) {
      event.api.applyColumnState({
        state: JSON.parse(sorting),
        applyOrder: true,
      });
    }

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

  const chartMenuItems = useCallback((params: any) => {
    return params.defaultItems.filter((item: string) => {
      return item !== 'chartLink' && item !== 'chartUnlink';
    });
  }, []);

  const handleConfirmDelete = async () => {
    await apiFetch(`v1/stats/graphs/${chartId}`, {
      method: 'DELETE',
    });
    onDelete();
    setOpenDialog(false);
  };

  return (
    <div className="border rounded bg-white">
      <ChartCardHeader
        title={currentTitle}
        onTitleChange={(newTitle) => setCurrentTitle(newTitle)}
        onSave={handleSave}
        showDialog={openDialog}
        setShowDialog={setOpenDialog}
        onConfirmDelete={handleConfirmDelete}
        justSaved={justSaved}
      />

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
            popupParent={document.body}
            chartMenuItems={chartMenuItems}
          />
        </div>
      </div>

      <div ref={containerRef} className="w-full h-[350px]" />
    </div>
  );
};

export default StatChart;
