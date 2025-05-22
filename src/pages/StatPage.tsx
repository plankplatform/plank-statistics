import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, IntegratedChartsModule } from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { apiFetch } from '../lib/api';
import Loader from '../components/Loader';
import StatHeader from '../components/StatHeader';
import StatChart from '../components/StatChart';
import StatTable from '../components/StatTable';
import SaveChartModal from '../components/SaveChartModal';
import type { ChartModel } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import type { MenuItemDef } from 'ag-grid-community';
import ReactDOMServer from 'react-dom/server';
import { Save } from 'lucide-react';
import { set } from 'date-fns';

const saveIconSvg = ReactDOMServer.renderToStaticMarkup(<Save size={14} />);

ModuleRegistry.registerModules([
  AllEnterpriseModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
]);

function castNumericValues(columns: string[], rows: Record<string, any>[]) {
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

function normalizeChartOptions(model: ChartModel): ChartModel {
  if (Array.isArray(model.chartOptions)) {
    model.chartOptions = {};
  }
  return model;
}

async function createStatGraph(payload: CreateStatGraphPayload): Promise<{ id: number }> {
  return apiFetch('v1/stats/graphs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

interface CreateStatGraphPayload {
  title: string;
  stat_id: number | string;
  config: ChartModel;
}

interface StatData {
  id: number | string;
  title: string;
  description?: string;
  footer?: string;
  columns: string[];
  rows: Record<string, any>[];
  frequency: number;
  lastexec_time: Date;
}

const StatPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const statId = Number(params.statId ?? '');
  const groupName = params.groupName ?? '';

  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'graphs'>('table');
  const [hasChart, setHasChart] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastChartModel, setLastChartModel] = useState<ChartModel | null>(null);
  const [lastChartFilter, setLastChartFilter] = useState<any>(null);
  const [lastChartSorting, setLastChartSorting] = useState<any>(null);
  const [savedGraphs, setSavedGraphs] = useState<any[]>([]);
  const [savedGraphsCache, setSavedGraphsCache] = useState<Record<number | string, any[]>>({});
  const [graphsLoading, setGraphsLoading] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const [tableFilters, setTableFilters] = useState({});
  const [tableColumnState, setTableColumnState] = useState<any[]>([]);
  const [gridIsReady, setGridIsReady] = useState(false);
  const [pivotMode, setPivotMode] = useState(false);
  const [rowGroupCols, setRowGroupCols] = useState<string[]>([]);
  const [pivotCols, setPivotCols] = useState<string[]>([]);
  const [valueCols, setValueCols] = useState<string[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  const handleSaveGridState = async () => {
    const api = gridRef.current?.api;
    if (!api) return;

    const grid_state = {
      filters: api.getFilterModel(),
      columnState: api.getColumnState(),
      pivotMode: api.isPivotMode(),
      rowGroupCols: api.getRowGroupColumns().map((c) => c.getColId()),
      pivotCols: api.getPivotColumns().map((c) => c.getColId()),
      valueCols: api.getValueColumns().map((c) => c.getColId()),
    };

    try {
      await apiFetch(`v1/stats/${data?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ grid_state }),
      });

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error('Errore durante il salvataggio:', err);
      alert('Errore durante il salvataggio del layout');
    }
  };

  const onReset = () => {
    if (!gridRef.current?.api || !gridRef.current?.api) return;

    gridRef.current.api.setFilterModel(null);
    gridRef.current.api.resetColumnState();
    //gridRef.current.api.autoSizeAllColumns();
    gridRef.current.api.sizeColumnsToFit();
    gridRef.current.api.setRowGroupColumns([]);
    gridRef.current.api.setPivotColumns([]);
    gridRef.current.api.setValueColumns([]);

    setTableFilters({});
    setTableColumnState(gridRef.current.api.getColumnState());
    setPivotMode(false);
    setRowGroupCols([]);
    setPivotCols([]);
    setValueCols([]);
  };

  const handleGridReady = () => {
    applyInitialGridState();
    setGridIsReady(true);
  };

  const applyInitialGridState = async () => {
    if (!gridRef.current?.api || !data) return;

    const api = gridRef.current.api;

    if (
      tableColumnState?.length > 0 ||
      pivotCols.length ||
      rowGroupCols.length ||
      valueCols.length
    ) {
      api.setFilterModel(tableFilters);
      api.setRowGroupColumns(rowGroupCols);
      api.setPivotColumns(pivotCols);
      api.setValueColumns(valueCols);

      api.applyColumnState({
        state: tableColumnState,
        applyOrder: true,
      });

      setGridIsReady(true);
    } else {
      //api.autoSizeAllColumns();
      api.sizeColumnsToFit();

      const currentState = api.getColumnState();
      const grid_state = {
        filters: {},
        columnState: currentState,
        pivotMode: false,
        rowGroupCols: [],
        pivotCols: [],
        valueCols: [],
      };

      try {
        await apiFetch(`v1/stats/${statId}`, {
          method: 'PATCH',
          body: JSON.stringify({ grid_state }),
        });

        setTableFilters({});
        setTableColumnState(currentState);
        setPivotMode(false);
        setRowGroupCols([]);
        setPivotCols([]);
        setValueCols([]);

        console.log('Grid state autosize salvato');
      } catch (err) {
        console.error('Errore salvataggio grid_state:', err);
      } finally {
        setGridIsReady(true);
      }
    }
  };

  useEffect(() => {
    if (isNaN(statId)) return;
    setLoading(true);

    apiFetch(`v1/stats/${statId}`)
      .then((raw: any) => {
        const columns = JSON.parse(raw.columns_order || '[]');
        const rows = castNumericValues(columns, JSON.parse(raw.json_results || '[]'));

        setData({
          id: Number(raw.id),
          title: raw.title,
          description: raw.description,
          footer: raw.footer,
          columns,
          rows,
          frequency: raw.frequency,
          lastexec_time: raw.lastexec_time,
        });

        const parsedGridState = raw.grid_state ? JSON.parse(raw.grid_state) : null;

        setTableFilters(parsedGridState?.filters ?? {});
        setTableColumnState(parsedGridState?.columnState ?? []);
        setPivotMode(parsedGridState?.pivotMode ?? false);
        setRowGroupCols(parsedGridState?.rowGroupCols ?? []);
        setPivotCols(parsedGridState?.pivotCols ?? []);
        setValueCols(parsedGridState?.valueCols ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statId]);

  useEffect(() => {
    if (view !== 'graphs' || !data) return;

    const cached = savedGraphsCache[data.id];
    if (cached) return;

    setGraphsLoading(true);
    apiFetch<any[]>(`v1/stats/graphs?stat_id=${data.id}`)
      .then((res) => {
        const parsed = res.map((graph) => {
          const config = typeof graph.config === 'string' ? JSON.parse(graph.config) : graph.config;
          const filters =
            typeof graph.filters === 'string' ? JSON.parse(graph.filters) : graph.filters;
          const sorting =
            typeof graph.sorting === 'string' ? JSON.parse(graph.sorting) : graph.sorting;

          return {
            ...graph,
            config: normalizeChartOptions(config),
            filters,
            sorting,
          };
        });

        setSavedGraphsCache((prev) => ({ ...prev, [data.id]: parsed }));
      })
      .catch(console.error)
      .finally(() => setGraphsLoading(false));
  }, [view, data]);

  if (loading) return <Loader />;
  if (!data) return <p className="text-center text-gray-600 mt-12">Statistica non trovata</p>;

  const columnDefs = data.columns.map((col) => {
    const isNumeric = data.rows.every((row) => typeof row[col] === 'number');
    return {
      field: col,
      filter: isNumeric ? 'agNumberColumnFilter' : 'agTextColumnFilter',
      sortable: true,
      type: isNumeric ? 'numericColumn' : undefined,
      enableRowGroup: true,
      enablePivot: true,
      enableValue: true,
    };
  });

  const getCustomChartMenuItems = (params: any): (string | MenuItemDef)[] => {
    const defaultItems = params.defaultItems;

    const customSaveItem: MenuItemDef = {
      name: 'Save Chart',
      action: () => {
        handleSaveChart();
      },
      icon: saveIconSvg,
    };

    return [customSaveItem, 'separator', ...defaultItems];
  };

  const handleSaveChart = () => {
    const api = gridRef.current?.api;
    const models = api?.getChartModels() || [];
    const filters = api?.getFilterModel() || [];
    const sorting = api?.getColumnState() || [];
    console.log('Sorting:', sorting);
    if (!models.length || !api) {
      alert('Nessun grafico da salvare.');
      return;
    }

    const lastModel = models[models.length - 1];
    setLastChartModel({ ...lastModel });
    setLastChartFilter(filters);
    setLastChartSorting(sorting);
    setShowModal(true);
  };

  const handleConfirmSave = (title: string) => {
    if (!lastChartModel || !data) return;

    const payload = {
      title,
      config: normalizeChartOptions(lastChartModel),
      filters: lastChartFilter,
      sorting: lastChartSorting,
      stat_id: data.id,
    };

    createStatGraph(payload)
      .then((res) => console.log('Grafico salvato con ID:', res.id))
      .catch((err) => {
        console.error('Errore durante il salvataggio:', err);
        alert('Errore durante il salvataggio del grafico');
      })
      .finally(() => setShowModal(false));

    setSavedGraphsCache((prev) => {
      const copy = { ...prev };
      delete copy[data.id];
      return copy;
    });
  };

  const graphs = data ? savedGraphsCache[data.id] ?? [] : [];

  return (
    <div className="px-6 py-4 w-5/6 mx-auto mb-24">
      <StatHeader
        title={data.title}
        description={data.description}
        frequency={data.frequency}
        lastExecTime={data.lastexec_time}
        view={view}
        onChangeView={setView}
        onReset={onReset}
        onSaveGridState={handleSaveGridState}
        justSaved={justSaved}
      />

      <div className={view === 'table' && gridIsReady ? '' : 'hidden'}>
        <StatTable
          key={gridIsReady ? 'ready' : 'waiting'}
          gridRef={gridRef}
          rowData={data.rows}
          columnDefs={columnDefs}
          setHasChart={setHasChart}
          chartMenuItems={getCustomChartMenuItems}
          onFiltersChange={setTableFilters}
          onColumnStateChange={setTableColumnState}
          onGridReady={handleGridReady}
          pivotMode={pivotMode}
        />
      </div>

      {view === 'graphs' &&
        (graphsLoading ? (
          <Loader />
        ) : graphs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center italic mt-24">{t('chart.empty_state')}</p>
        ) : (
          <div className="space-y-12 mt-2">
            {graphs.map((graph) => (
              <div key={graph.id}>
                <StatChart
                  filters={graph.filters}
                  sorting={graph.sorting}
                  model={graph.config}
                  data={data.rows}
                  columns={data.columns}
                  chartId={graph.id}
                  title={graph.title}
                  isStarred={graph.is_starred}
                  openTable={false}
                  statId={data.id}
                  onDelete={() => {
                    setSavedGraphsCache((prev) => {
                      const updated = { ...prev };
                      updated[data.id] = updated[data.id].filter((g) => g.id !== graph.id);
                      return updated;
                    });
                  }}
                  updateCachedGraph={(graphId, updatedData) => {
                    setSavedGraphsCache((prev) => {
                      const updated = { ...prev };
                      const current = updated[data.id] || [];
                      updated[data.id] = current.map((g) =>
                        g.id === graphId ? { ...g, ...updatedData } : g
                      );
                      return updated;
                    });
                  }}
                />
              </div>
            ))}
          </div>
        ))}

      {showModal && lastChartModel && (
        <SaveChartModal onClose={() => setShowModal(false)} onSave={handleConfirmSave} />
      )}
    </div>
  );
};

export default StatPage;
