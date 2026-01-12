import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import SaveTableModal from '../components/SaveTableModal';
import SavedTableView from '../components/SavedTableView';
import type { ChartModel } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import type { MenuItemDef } from 'ag-grid-community';
import ReactDOMServer from 'react-dom/server';
import { Save } from 'lucide-react';
import type { StatHistoryItem } from '../components/StatChartHeader';
import AccordionMenu from "@/components/AccordionMenu";
import RenameTableModal from '../components/RenameTableModal';

import { 
  castNumericValues, 
  normalizeChartOptions, 
  deepClone, 
  parseColumnsOrder, 
  parseJsonRows, 
  normalizeCol} from '@/lib/utils';

const saveIconSvg = ReactDOMServer.renderToStaticMarkup(<Save size={14} />);

ModuleRegistry.registerModules([
  AllEnterpriseModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
]);

interface TableGridStateSnapshot {
  filters: Record<string, any>;
  columnState: any[];
  pivotMode: boolean;
  rowGroupCols: string[];
  pivotCols: string[];
  valueCols: string[];
}

interface TableConfigItem {
  id: number;
  title: string;
  grid_state?: unknown;
  created_at?: string | null;
}

// Ricostruisce lo stato della griglia ritornado uno "screen" della struttura
const parseGridState = (value: unknown): TableGridStateSnapshot | null => {
  if (!value) return null;

  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (err) {
      console.error('Unable to parse grid state from history item:', err);
      return null;
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const raw = parsed as Record<string, any>;

  return {
    filters: raw.filters && typeof raw.filters === 'object' ? deepClone(raw.filters) : {},
    columnState: Array.isArray(raw.columnState) ? deepClone(raw.columnState) : [],
    pivotMode: !!raw.pivotMode,
    rowGroupCols: Array.isArray(raw.rowGroupCols)
      ? raw.rowGroupCols.filter((col: unknown): col is string => typeof col === 'string')
      : [],
    pivotCols: Array.isArray(raw.pivotCols)
      ? raw.pivotCols.filter((col: unknown): col is string => typeof col === 'string')
      : [],
    valueCols: Array.isArray(raw.valueCols)
      ? raw.valueCols.filter((col: unknown): col is string => typeof col === 'string')
      : [],
  };
};

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
  lastexec_time: string;
}

interface TableHistoryOverride {
  id: number;
  columns: string[];
  rows: Record<string, any>[];
}

const StatPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const statId = Number(params.statId ?? '');
  const groupName = params.groupName ?? '';

  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'graphs' | 'saved'>('table');
  const [hasChart, setHasChart] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastChartModel, setLastChartModel] = useState<ChartModel | null>(null);
  const [lastChartFilter, setLastChartFilter] = useState<any>(null);
  const [lastChartSorting, setLastChartSorting] = useState<any>(null);
  const [savedGraphs, setSavedGraphs] = useState<any[]>([]);
  const [savedGraphsCache, setSavedGraphsCache] = useState<Record<number | string, any[]>>({});
  const [graphsLoading, setGraphsLoading] = useState(false);
  const gridRef = useRef<AgGridReact>(null);
  const tableFiltersRef = useRef<Record<string, any>>({});
  const [tableColumnState, setTableColumnState] = useState<any[]>([]);
  const [gridIsReady, setGridIsReady] = useState(false);
  const [pivotMode, setPivotMode] = useState(false);
  const [rowGroupCols, setRowGroupCols] = useState<string[]>([]);
  const [pivotCols, setPivotCols] = useState<string[]>([]);
  const [valueCols, setValueCols] = useState<string[]>([]);
  const [justSaved, setJustSaved] = useState(false);

  // New: variabili relative allo storico tabella
  const [tableHistory, setTableHistory] = useState<StatHistoryItem[]>([]);
  const [tableHistoryLoaded, setTableHistoryLoaded] = useState(false);
  const [tableHistoryLoading, setTableHistoryLoading] = useState(false);
  const [tableHistoryError, setTableHistoryError] = useState<string | null>(null);
  const [selectedTableHistoryId, setSelectedTableHistoryId] = useState<number | null>(null);
  const [selectedTableHistoryLabel, setSelectedTableHistoryLabel] = useState<string | undefined>();
  const [tableOverride, setTableOverride] = useState<TableHistoryOverride | null>(null);
  const tableHistoryPreviousStateRef = useRef<TableGridStateSnapshot | null>(null);

  // Configurazioni tabelle salvate
  const [tableConfigs, setTableConfigs] = useState<TableConfigItem[]>([]);
  const [tableConfigsLoading, setTableConfigsLoading] = useState(false);
  const [tableConfigsError, setTableConfigsError] = useState<string | null>(null);
  const [showSaveTableModal, setShowSaveTableModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: number; title: string } | null>(null);


  // Menu a tendina laterale
  const [sidebarGroups, setSidebarGroups] = useState<{ group: string; stats: { id: number; title: string; description?: string }[] }[]>([]);
  const [activeGroupFinal, setActiveGroupFinal] = useState<string | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // Inizializza griglia Ag Grid al caricamento o se cambiano i dati [data,pivotMode,...]
  const applyInitialGridState = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api || !data) return;

    const hasSavedState =
      (tableColumnState?.length ?? 0) > 0 ||
      rowGroupCols.length > 0 ||
      pivotCols.length > 0 ||
      valueCols.length > 0 ||
      (tableFiltersRef.current && Object.keys(tableFiltersRef.current).length > 0) ||
      pivotMode;

    // Verifico se effettivamente c'è uno stato da salvare
    if (hasSavedState) {
      if (tableFiltersRef.current && Object.keys(tableFiltersRef.current).length > 0) {
        api.setFilterModel(tableFiltersRef.current);
      } else {
        api.setFilterModel(null);
      }

      api.setRowGroupColumns(rowGroupCols);
      api.setPivotColumns(pivotCols);
      api.setValueColumns(valueCols);

      // Evito se non ci sono elementi
      if (tableColumnState?.length) {
        api.applyColumnState({
          state: tableColumnState,
          applyOrder: true,
        });
      }
    } else {
      // No stato -> griglia ripulita
      api.setFilterModel(null);
      api.setRowGroupColumns([]);
      api.setPivotColumns([]);
      api.setValueColumns([]);
      api.sizeColumnsToFit();
    }

    setGridIsReady(true);
  }, [data, pivotMode, tableColumnState, rowGroupCols, pivotCols, valueCols]);

  // Stessa logica di handleHistoryLoad in StatChartHeader
  const handleTableHistoryLoad = async (open: boolean) => {
    if (!open || tableHistoryLoaded || tableHistoryLoading || Number.isNaN(statId)) return;

    setTableHistoryLoading(true);
    setTableHistoryError(null);

    try {
      const response = await apiFetch<StatHistoryItem[]>(`v1/stats/${statId}/history`);
      setTableHistory(Array.isArray(response) ? response : []);
      setTableHistoryLoaded(true);
    } catch (error) {
      console.error('Error while fetching table history:', error);
      if (error instanceof Error && error.message.includes('404')) {
        setTableHistory([]);
        setTableHistoryLoaded(true);
      } else {
        setTableHistoryError(t('history.error'));
      }
    } finally {
      setTableHistoryLoading(false);
    }
  };

  // Gestione selezione della versione della tabella (logica simile a handleHistoryLoad`)
  const handleTableHistorySelect = ( item: StatHistoryItem, { label }: { index: number; label: string }) => {
    if (!data) return;

    // Salvo lo stato della tabella se nessuna versione/stato è stato selezionato
    if (selectedTableHistoryId === null && !tableHistoryPreviousStateRef.current) {
      tableHistoryPreviousStateRef.current = {
        filters: deepClone(tableFiltersRef.current) ?? {},
        columnState: deepClone(tableColumnState) ?? [],
        pivotMode,
        rowGroupCols: [...rowGroupCols],
        pivotCols: [...pivotCols],
        valueCols: [...valueCols],
      };
    }

    const fallbackColumns = data.columns;
    const parsedColumns = parseColumnsOrder(item.columns_order, fallbackColumns);
    const effectiveColumns = parsedColumns.length ? parsedColumns : fallbackColumns;
    const parsedRows = parseJsonRows(item.json_results);
    const castedRows = castNumericValues(effectiveColumns, parsedRows);

    const parsedGridState = parseGridState(item.grid_state);

    tableFiltersRef.current = parsedGridState?.filters ?? {};
    setTableColumnState(parsedGridState?.columnState ?? []);
    setPivotMode(parsedGridState?.pivotMode ?? false);
    setRowGroupCols(parsedGridState?.rowGroupCols ?? []);
    setPivotCols(parsedGridState?.pivotCols ?? []);
    setValueCols(parsedGridState?.valueCols ?? []);

    setSelectedTableHistoryId(item.historical_id);
    setSelectedTableHistoryLabel(label);
    setTableOverride({
      id: item.historical_id,
      columns: effectiveColumns,
      rows: castedRows,
    });

    setTimeout(() => {
      if (gridIsReady) {
        applyInitialGridState();
      }
    }, 0);
  };

  // Ricarica la versione principale 
  const handleTableHistoryReset = () => {
    if (!data) return;

    const snapshot = tableHistoryPreviousStateRef.current;

    setTableOverride(null);
    setSelectedTableHistoryId(null);
    setSelectedTableHistoryLabel(undefined);

    if (snapshot) {
      tableFiltersRef.current = deepClone(snapshot.filters) ?? {};
      setTableColumnState(deepClone(snapshot.columnState) ?? []);
      setPivotMode(snapshot.pivotMode);
      setRowGroupCols([...snapshot.rowGroupCols]);
      setPivotCols([...snapshot.pivotCols]);
      setValueCols([...snapshot.valueCols]);
    } else {
      tableFiltersRef.current = {};
      setTableColumnState([]);
      setPivotMode(false);
      setRowGroupCols([]);
      setPivotCols([]);
      setValueCols([]);
    }

    tableHistoryPreviousStateRef.current = null;

    setTimeout(() => {
      if (gridIsReady) {
        applyInitialGridState();
      }
    }, 0);
  };

  const handleSaveGridState = async () => {
    const api = gridRef.current?.api;
    if (!api || !data) return;

    const grid_state = {
      filters: api.getFilterModel(),
      columnState: api.getColumnState(),
      pivotMode: api.isPivotMode(),
      rowGroupCols: api.getRowGroupColumns().map((c) => c.getColId()),
      pivotCols: api.getPivotColumns().map((c) => c.getColId()),
      valueCols: api.getValueColumns().map((c) => c.getColId()),
    };

    try {
      await apiFetch(`v1/stats/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ grid_state }),
      });

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error('Error while saving:', err);
      alert('Error during layout saving');
    }
  };

  const handleRenameTableConfig = async (configId: number, nextTitle: string) => {
  if (!data) return;

  try {
    await apiFetch(`v1/stats/${data.id}/tableConfigs/${configId}`, {
      method: 'PUT',
      body: JSON.stringify({ title: nextTitle }),
    });

    setTableConfigs((prev) =>
      prev.map((item) => (item.id === configId ? { ...item, title: nextTitle } : item))
    );
  } catch (err) {
    console.error('Errore durante la modifica della vista:', err);
    alert('Errore durante la modifica della vista tabella');
  }
};


  const handleConfirmSaveTableConfig = async (title: string) => {
    const api = gridRef.current?.api;
    if (!api || !data) return;

    const grid_state = {
      filters: api.getFilterModel(),
      columnState: api.getColumnState(),
      pivotMode: api.isPivotMode(),
      rowGroupCols: api.getRowGroupColumns().map((c) => c.getColId()),
      pivotCols: api.getPivotColumns().map((c) => c.getColId()),
      valueCols: api.getValueColumns().map((c) => c.getColId()),
    };

    try {
      await apiFetch(`v1/stats/${data.id}/tableConfigs`, {
        method: 'POST',
        body: JSON.stringify({ title, grid_state }),
      });

      const refreshed = await apiFetch<TableConfigItem[]>(
        `v1/stats/${data.id}/tableConfigs`
      );
      setTableConfigs(Array.isArray(refreshed) ? refreshed : []);
      setShowSaveTableModal(false);
    } catch (err) {
      console.error('Error while saving configuration:', err);
      alert('Error during configuration saving');
    }
  };

  const handleDeleteTableConfig = async (configId: number) => {
    if (!data) return;

    try {
      await apiFetch(`v1/stats/${data.id}/tableConfigs/${configId}`, {
        method: 'DELETE',
      });

      setTableConfigs((prev) => prev.filter((item) => item.id !== configId));
    } catch (err) {
      console.error('Error while deleting the filtered table:', err);
      alert('Error while deleting the filtered table');
    }
  };

  const onDownloadCsv = () => {
    const api = gridRef.current?.api;
    if (!api) {
      alert('Error downloading CSV');
      return;
    }
    api.exportDataAsCsv({ fileName: `${data?.title || 'export'}.csv` });
  };

  const onDownloadExcel = () => {
    const api = gridRef.current?.api;
    if (!api) {
      alert('Error downloading Excel');
      return;
    }
    if (api.exportDataAsExcel) {
      api.exportDataAsExcel({
        fileName: `${data?.title || 'export'}.xlsx`,
        sheetName: 'Sheet1',
      });
    } else {
      alert('Error downloading Excel');
    }
  };

  const onReset = () => {
    if (!gridRef.current?.api) return;

    gridRef.current.api.setFilterModel(null);
    gridRef.current.api.resetColumnState();
    gridRef.current.api.sizeColumnsToFit();
    gridRef.current.api.setRowGroupColumns([]);
    gridRef.current.api.setPivotColumns([]);
    gridRef.current.api.setValueColumns([]);

    tableFiltersRef.current = {};
    setTableColumnState(gridRef.current.api.getColumnState());
    setPivotMode(false);
    setRowGroupCols([]);
    setPivotCols([]);
    setValueCols([]);
    tableHistoryPreviousStateRef.current = null;
    setSelectedTableHistoryId(null);
    setSelectedTableHistoryLabel(undefined);
    setTableOverride(null);
  };

  const handleGridReady = () => {
    applyInitialGridState();
    setGridIsReady(true);
  };

  useEffect(() => {
    setTableHistory([]);
    setTableHistoryLoaded(false);
    setTableHistoryLoading(false);
    setTableHistoryError(null);
    setSelectedTableHistoryId(null);
    setSelectedTableHistoryLabel(undefined);
    setTableOverride(null);
    tableHistoryPreviousStateRef.current = null;

    setTableConfigs([]);
    setTableConfigsLoading(false);
    setTableConfigsError(null);
    setShowSaveTableModal(false);
  }, [statId]);

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

        const parsedGridState = parseGridState(raw.grid_state);

        tableFiltersRef.current = parsedGridState?.filters ?? {};
        setTableColumnState(parsedGridState?.columnState ?? []);
        setPivotMode(parsedGridState?.pivotMode ?? false);
        setRowGroupCols(parsedGridState?.rowGroupCols ?? []);
        setPivotCols(parsedGridState?.pivotCols ?? []);
        setValueCols(parsedGridState?.valueCols ?? []);

        tableHistoryPreviousStateRef.current = null;
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
  }, [view, data, savedGraphsCache]);

  useEffect(() => {
    if (Number.isNaN(statId)) return;

    setTableConfigsLoading(true);
    setTableConfigsError(null);

    apiFetch<TableConfigItem[]>(`v1/stats/${statId}/tableConfigs`)
      .then((res) => {
        setTableConfigs(Array.isArray(res) ? res : []);
      })
      .catch((error) => {
        console.error('Error while fetching table configs:', error);
        setTableConfigsError(t('table_config.error'));
      })
      .finally(() => setTableConfigsLoading(false));
  }, [statId, t]);

  useEffect(() => {
    setSidebarLoading(true);
    apiFetch('v1/stats')
      .then((raw) => {
        const mapped = Object.entries(raw).map(([group, stats]: any) => ({
          group,
          stats: stats.map((s: any) => ({
            id: Number(s.id),
            title: s.title,
            description: s.description,
          })),
        }));

        setSidebarGroups(mapped);

        for (const grp of mapped) {
          if (grp.stats.some((s: { id: number | string }) => Number(s.id) === statId)) {
            setActiveGroupFinal(grp.group);
            break;
          }
        }
      })
      .finally(() => setSidebarLoading(false));
  }, [statId]);

  const effectiveRows = tableOverride?.rows ?? data?.rows ?? [];

  const columnDefs = useMemo(() => {
    if (!data) return [];
    const columnsSource = tableOverride?.columns ?? data.columns;
    const rowsSource = tableOverride?.rows ?? data.rows;

    return columnsSource.map((col) => {
      const values = rowsSource.map((row) => row[col]);

      const isNumeric = values.every((val) => typeof val === 'number');
      const isDate = values.every(
        (val) => typeof val === 'string' && !Number.isNaN(Date.parse(val))
      );

      let filter: any;
      let type: any;
      let filterParams: any;

      if (isNumeric) {
        filter = 'agNumberColumnFilter';
        type = 'numericColumn';
      } else if (isDate) {
        filter = 'agDateColumnFilter';
        type = 'dateColumn';
        filterParams = {
          comparator: (filterDate: Date, cellValue: string) => {
            const cellDate = new Date(cellValue);
            const cellTime = new Date(
              cellDate.getFullYear(),
              cellDate.getMonth(),
              cellDate.getDate()
            ).getTime();
            const filterTime = new Date(
              filterDate.getFullYear(),
              filterDate.getMonth(),
              filterDate.getDate()
            ).getTime();
            if (cellTime < filterTime) return -1;
            if (cellTime > filterTime) return 1;
            return 0;
          },
        };
      } else {
        filter = 'agTextColumnFilter';
      }

      return {
        colId: col,
        field: col,
        headerName: normalizeCol(col),
        filter,
        sortable: true,
        type,
        filterParams,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
      };
    });
  }, [data, tableOverride]);

  if (loading) return <Loader />;
  if (!data) return <p className="text-center text-gray-600 mt-12">{t('stats.no_data')}</p>;

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
      alert('No charts to save');
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
      .then((res) => console.log('Chart saved'))
      .catch((err) => {
        console.error('Error while saving:', err);
        alert('Error during chart saving');
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
  <div className="px-6 py-4 w-[95%] mx-auto mb-24">
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
      onDownloadCsv={onDownloadCsv}
      onDownloadExcel={onDownloadExcel}
      disableSave={selectedTableHistoryId !== null}
      onSaveTableConfig={() => setShowSaveTableModal(true)}
      tableHistory={
        data
          ? {
              items: tableHistory,
              loading: tableHistoryLoading,
              error: tableHistoryError,
              onOpenChange: handleTableHistoryLoad,
              onSelect: handleTableHistorySelect,
              onReset: handleTableHistoryReset,
              selectedId: selectedTableHistoryId,
              selectedLabel: selectedTableHistoryLabel,
            }
          : undefined
      }
    />

    <div className="flex gap-6 md:gap-8 mt-6">
      <div className="w-48 shrink-0 hidden md:block">
        {sidebarLoading ? (
          <Loader />
        ) : (
          activeGroupFinal && (
            <AccordionMenu
              items={sidebarGroups}
              activeGroup={activeGroupFinal}
              activeStatId={statId}
            />
          )
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={view === 'table' && gridIsReady ? '' : 'hidden'}>
          <StatTable
            key={gridIsReady ? 'ready' : 'waiting'}
            gridRef={gridRef}
            rowData={effectiveRows}
            columnDefs={columnDefs}
            setHasChart={setHasChart}
            chartMenuItems={getCustomChartMenuItems}
            onFiltersChange={(filters) => {
              tableFiltersRef.current = filters;
            }}
            onColumnStateChange={setTableColumnState}
            onGridReady={handleGridReady}
            pivotMode={pivotMode}
          />
        </div>

        {view === 'saved' && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  {t('table_config.section_title')}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('table_config.section_help')}
                </p>
              </div>
              {/*
                <Button
                  className="bg-plank-pink text-white hover:bg-plank-pink/90"
                  onClick={() => setShowSaveTableModal(true)}
                  disabled={selectedTableHistoryId !== null}
                >
                  {t('table_config.save_button')}
                </Button>
              */}
            </div>

            {tableConfigsLoading ? (
              <div className="py-4">
                <Loader />
              </div>
            ) : tableConfigsError ? (
              <p className="text-xs text-red-500">{tableConfigsError}</p>
            ) : tableConfigs.length === 0 ? (
              <p className="text-xs text-gray-500">{t('table_config.empty_state')}</p>
            ) : (
              tableConfigs.map((item) => {
                const parsedGridState = parseGridState(item.grid_state);
                return (
                  <SavedTableView
                    key={item.id}
                    title={item.title}
                    columns={data.columns}
                    rows={data.rows}
                    gridState={parsedGridState}
                    onDelete={() => handleDeleteTableConfig(item.id)}
                    onRename={() => setRenameTarget({ id: item.id, title: item.title })}

                  />
                );
              })
            )}
          </div>
        )}

        {view === 'graphs' &&
          (graphsLoading ? (
            <Loader />
          ) : graphs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center italic mt-24">
              {t('chart.empty_state')}
            </p>
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
      </div>
    </div>

    {showModal && lastChartModel && (
      <SaveChartModal onClose={() => setShowModal(false)} onSave={handleConfirmSave} />
    )}

    {showSaveTableModal && (
      <SaveTableModal
        onClose={() => setShowSaveTableModal(false)}
        onSave={handleConfirmSaveTableConfig}
      />
    )}

    {renameTarget && (
      <RenameTableModal
        initialTitle={renameTarget.title}
        onClose={() => setRenameTarget(null)}
        onSave={(nextTitle) => {
          handleRenameTableConfig(renameTarget.id, nextTitle);
          setRenameTarget(null);
        }}
      />
    )}

  </div>
);

};

export default StatPage;
