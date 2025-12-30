import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { myTheme } from '../styles/agTheme';
import { Button } from '@/components/ui/button';
import { normalizeCol } from '@/lib/utils';
import { Pencil, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface TableGridStateSnapshot {
  filters: Record<string, any>;
  columnState: any[];
  pivotMode: boolean;
  rowGroupCols: string[];
  pivotCols: string[];
  valueCols: string[];
}

interface SavedTableViewProps {
  title: string;
  columns: string[];
  rows: Record<string, any>[];
  gridState: TableGridStateSnapshot | null;
  onDelete: () => void;
  onRename: () => void;
}

const SavedTableView = ({
  title,
  columns,
  rows,
  gridState,
  onDelete,
  onRename,
}: SavedTableViewProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const { t } = useTranslation();
  const [openDelete, setOpenDelete] = useState(false);
  const columnDefs = useMemo<ColDef[]>(() => {
    return columns.map((col) => {
      const values = rows.map((row) => row[col]);

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
      } as ColDef;
    });
  }, [columns, rows]);

  const applyGridState = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api || !gridState) return;

    api.setFilterModel(gridState.filters ?? null);
    api.setRowGroupColumns(gridState.rowGroupCols ?? []);
    api.setPivotColumns(gridState.pivotCols ?? []);
    api.setValueColumns(gridState.valueCols ?? []);

    if (gridState.columnState?.length) {
      api.applyColumnState({ state: gridState.columnState, applyOrder: true });
    }
  }, [gridState]);

  useEffect(() => {
    applyGridState();
  }, [applyGridState]);

  return (
    <div className="border rounded bg-white p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xl font-semibold text-gray-800">{title}</h4>
        <div className="flex items-center gap-2">
          {/* RINOMINA TITOLO */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onRename}>
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('table_config.rename_title')}</p>
            </TooltipContent>
          </Tooltip>

          {/* ELIMINA TABELLA */}
          <Dialog open={openDelete} onOpenChange={setOpenDelete}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-lg w-8 h-8">
                    <X className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('button.delete')}</p>
              </TooltipContent>
            </Tooltip>

            <DialogContent>
              <div className="text-sm">{t('table_config.confirm_delete')}</div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setOpenDelete(false)}>
                  {t('button.cancel')}
                </Button>
                <Button
                  className="bg-plank-pink text-white hover:bg-plank-pink/90"
                  onClick={() => {
                    onDelete();
                    setOpenDelete(false);
                  }}
                >
                  {t('button.delete')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AgGridReact
        ref={gridRef}
        rowData={rows}
        columnDefs={columnDefs}
        domLayout="autoHeight"
        theme={myTheme}
        pivotMode={gridState?.pivotMode ?? false}
        suppressMovableColumns
        suppressMenuHide
        pagination={true}
        paginationPageSize={20}
        onGridReady={() => applyGridState()}
      />
    </div>
  );
};

export default SavedTableView;
