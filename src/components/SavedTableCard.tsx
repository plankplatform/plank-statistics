import { useMemo, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { AgGridReact as AgGridReactType } from 'ag-grid-react';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { myTheme } from '@/styles/agTheme';
import { apiFetch } from '@/lib/api';
import { castNumericValues, deepClone, normalizeCol } from '@/lib/utils';
import { useTranslation } from 'react-i18next';


interface TableGridStateSnapshot {
  filters: Record<string, any>;
  columnState: any[];
  pivotMode: boolean;
  rowGroupCols: string[];
  pivotCols: string[];
  valueCols: string[];
}

interface SavedTable {
  id: number;
  title: string;
  columns: string[];
  rows: Record<string, any>[];
  grid_state?: TableGridStateSnapshot | string | null;
}

interface SavedTableCardProps {
  table: SavedTable;
  onDelete: () => void;
  onUpdate: (id: number, updated: Partial<SavedTable>) => void;
}

const parseGridState = (value: unknown): TableGridStateSnapshot | null => {
  if (!value) return null;

  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (err) {
      console.error('Unable to parse grid state:', err);
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

const SavedTableCard = ({ table, onDelete, onUpdate }: SavedTableCardProps) => {
  const { t } = useTranslation();
  const gridRef = useRef<AgGridReactType>(null);
  const columnApiRef = useRef<any>(null);

  const [currentTitle, setCurrentTitle] = useState(table.title);
  const [justSaved, setJustSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => setCurrentTitle(table.title), [table.title]);

  const gridState = useMemo(() => parseGridState(table.grid_state), [table.grid_state]);

  const castedRows = useMemo(
    () => castNumericValues(table.columns, table.rows),
    [table.columns, table.rows]
  );

  const columnDefs = useMemo(() => {
    return table.columns.map((col) => {
      const values = table.rows.map((row) => row[col]);
      const isNumeric = values.every((val) => typeof val === 'number');
      return {
        colId: col,
        field: col,
        headerName: normalizeCol(col),
        filter: isNumeric ? 'agNumberColumnFilter' : 'agTextColumnFilter',
        sortable: true,
        enableRowGroup: true,
        enablePivot: true,
        enableValue: true,
      };
    });
  }, [table.columns, table.rows]);

  const applyGridState = () => {
  const api = gridRef.current?.api;
  const columnApi = columnApiRef.current;
  if (!api || !columnApi || !gridState) return;

  api.setFilterModel(gridState.filters ?? {});

  columnApi.setPivotMode(!!gridState.pivotMode);
  columnApi.setRowGroupColumns(gridState.rowGroupCols ?? []);
  columnApi.setPivotColumns(gridState.pivotCols ?? []);
  columnApi.setValueColumns(gridState.valueCols ?? []);

  if (gridState.columnState?.length) {
    columnApi.applyColumnState({
      state: gridState.columnState,
      applyOrder: true,
    });
  }

  //api.sizeColumnsToFit();
  columnApi.autoSizeAllColumns();
};



  const handleSave = async () => {
    const api = gridRef.current?.api;
    const grid_state: TableGridStateSnapshot = api
      ? {
          filters: api.getFilterModel(),
          columnState: api.getColumnState(),
          pivotMode: api.isPivotMode(),
          rowGroupCols: api.getRowGroupColumns().map((c) => c.getColId()),
          pivotCols: api.getPivotColumns().map((c) => c.getColId()),
          valueCols: api.getValueColumns().map((c) => c.getColId()),
        }
      : (gridState ?? {
          filters: {},
          columnState: [],
          pivotMode: false,
          rowGroupCols: [],
          pivotCols: [],
          valueCols: [],
        });

    await apiFetch(`v1/stats/tables/${table.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: currentTitle.trim(),
        columns: table.columns,
        rows: table.rows,
        grid_state,
      }),
    });

    onUpdate(table.id, { title: currentTitle.trim(), grid_state });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleDelete = async () => {
    await apiFetch(`v1/stats/tables/${table.id}`, { method: 'DELETE' });
    onDelete();
  };

  return (
    <div className="border rounded bg-white">
      <div className="inline-block w-max min-w-full">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 bg-gray-50">
          <Input
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            className="max-w-md"
          />
          <div className="flex items-center gap-2">
            {justSaved && <span className="text-xs text-gray-500">{t('label.saved')}</span>}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Save className="size-5 text-gray-800" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <div className="text-sm">{t('table.confirm_save')}</div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    {t('button.cancel')}
                  </Button>
                  <Button
                    className="bg-plank-pink text-white hover:bg-plank-pink/90"
                    onClick={() => {
                      setShowSaveDialog(false);
                      handleSave();
                    }}
                  >
                    {t('button.save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="size-5 text-gray-800" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <div className="text-sm">{t('table.confirm_delete')}</div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    {t('button.cancel')}
                  </Button>
                  <Button
                    className="bg-plank-pink text-white hover:bg-plank-pink/90"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      handleDelete();
                    }}
                  >
                    {t('button.delete')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="px-4 py-4 overflow-x-auto">
          <AgGridReact
            ref={gridRef}
            rowData={castedRows}
            columnDefs={columnDefs}
            domLayout="autoHeight"
            theme={myTheme}
            pagination={true}
            paginationPageSize={20}
            pivotMode={gridState?.pivotMode ?? false}
            onGridReady={(params) => {
              columnApiRef.current = (params as any).columnApi;
              applyGridState();
              }}
            sideBar={{
              defaultToolPanel: undefined,
              toolPanels: [
                {
                  id: 'columns',
                  labelDefault: 'Columns',
                  labelKey: 'columns',
                  iconKey: 'columns',
                  toolPanel: 'agColumnsToolPanel',
                },
                {
                  id: 'filters',
                  labelDefault: 'Filters',
                  labelKey: 'filters',
                  iconKey: 'filter',
                  toolPanel: 'agFiltersToolPanel',
                },
              ],
            }}



          />
        </div>
      </div>
    </div>
  );
};

export default SavedTableCard;
