import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { AgGridReact as AgGrid } from 'ag-grid-react';
import type { AgGridReact } from 'ag-grid-react';
import type { ColDef, FirstDataRenderedEvent } from 'ag-grid-community';
import { ChartModel } from 'ag-grid-community';
import StatChartHeader from './StatChartHeader';
import { apiFetch } from '@/lib/api';
import { invalidateStarredGraphs } from '@/lib/starredGraphsStore';

interface StatChartsProps {
  model: ChartModel;
  data: Record<string, any>[];
  columns: string[];
  filters?: any;
  sorting?: any;
  chartId: number;
  title: string;
  onDelete: () => void;
  updateCachedGraph: (graphId: number, updatedData: Partial<any>) => void;
  isStarred: boolean;
  openTable: boolean;
  statId: number | string;
}

const StatChart = ({
  model,
  data,
  columns,
  filters,
  sorting,
  chartId,
  title,
  isStarred: isStarredProp,
  onDelete,
  updateCachedGraph,
  openTable,
  statId,
}: StatChartsProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentModel, setCurrentModel] = useState(model);
  const [currentFilters, setCurrentFilters] = useState(filters);
  const [currentSorting, setCurrentSorting] = useState(sorting);
  const [isStarred, setIsStarred] = useState(isStarredProp);

  const toggleStar = async () => {
    const newValue = !isStarred;
    setIsStarred(newValue);

    try {
      await apiFetch(`v1/stats/graphs/${chartId}/starred`, {
        method: 'PATCH',
        body: JSON.stringify({ is_starred: newValue }),
      });

      invalidateStarredGraphs();

      updateCachedGraph(chartId, {
        is_starred: newValue,
      });
    } catch (err) {
      console.error('Errore durante il toggle del preferito:', err);
      alert('Errore durante il salvataggio del preferito');
      setIsStarred(!newValue);
    }
  };

  useEffect(() => setCurrentTitle(title), [title]);
  useEffect(() => setCurrentModel(model), [model]);
  useEffect(() => setCurrentFilters(filters), [filters]);
  useEffect(() => setCurrentSorting(sorting), [sorting]);

  const castNumericValues = (rows: Record<string, any>[], cols: string[]) =>
    rows.map((row) => {
      const newRow: Record<string, any> = {};
      for (const key of cols) {
        const val = row[key];
        newRow[key] = !isNaN(val) && val !== '' && val !== null ? Number(val) : val;
      }
      return newRow;
    });

  const castedData = useMemo(() => castNumericValues(data, columns), [data, columns]);

  const handleSave = async () => {
    const api = gridRef.current?.api;
    const models = api?.getChartModels() || [];
    if (!models.length || !api) return;

    const updatedModel = models[models.length - 1];
    const updatedFilters = api.getFilterModel();
    const updatedSorting = api.getColumnState();

    try {
      await apiFetch(`v1/stats/graphs/${chartId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: currentTitle.trim(),
          config: updatedModel,
          filters: updatedFilters,
          sorting: updatedSorting,
          is_starred: isStarred,
        }),
      });

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);

      updateCachedGraph(chartId, {
        title: currentTitle.trim(),
        config: updatedModel,
        filters: updatedFilters,
        sorting: updatedSorting,
        is_starred: isStarred,
      });

      invalidateStarredGraphs();

      setCurrentModel(updatedModel);
      setCurrentFilters(updatedFilters);
      setCurrentSorting(updatedSorting);
    } catch (err) {
      console.error('Errore durante il salvataggio:', err);
      alert('Errore durante il salvataggio');
    }
  };

  const colDefs: ColDef[] = columns.map((col) => {
    const firstValue = castedData.find((row) => row[col] !== undefined && row[col] !== null)?.[col];
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

    if (Array.isArray(currentSorting) && currentSorting.length > 0) {
      event.api.applyColumnState({
        state: currentSorting,
        applyOrder: true,
      });
    }

    if (currentFilters && Object.keys(currentFilters).length > 0) {
      event.api.setFilterModel(currentFilters);

      setTimeout(() => {
        const chartRef = event.api.restoreChart(currentModel, container);
        if (!chartRef) {
          console.warn('Impossibile ricreare il grafico');
        }
      }, 100);
    } else {
      const chartRef = event.api.restoreChart(currentModel, container);
      if (!chartRef) {
        console.warn('Impossibile ricreare il grafico');
      }
    }
  };

  const chartMenuItems = useCallback((params: any): any => {
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
      <StatChartHeader
        title={currentTitle}
        onTitleChange={(newTitle) => setCurrentTitle(newTitle)}
        onSave={handleSave}
        showDialog={openDialog}
        setShowDialog={setOpenDialog}
        onConfirmDelete={handleConfirmDelete}
        justSaved={justSaved}
        isStarred={isStarred}
        onToggleStar={toggleStar}
        openTable={openTable}
        statId={statId}
      />

      <div style={{ display: 'none' }}>
        <div className="ag-theme-alpine" style={{ height: 1, width: 1 }}>
          <AgGrid
            ref={gridRef}
            rowData={castedData}
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
