import { useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { myTheme } from '../styles/agTheme';
import { GridApi } from 'ag-grid-community';

interface StatTableProps {
  gridRef: React.RefObject<AgGridReact<any> | null>;
  rowData: Record<string, any>[];
  columnDefs: any[];
  onChartCreated?: () => void;
  setHasChart: (hasChart: boolean) => void;
  chartMenuItems: any;
  onFiltersChange: (filters: any) => void;
  onColumnStateChange: (state: any[]) => void;
  onGridReady: () => void;
  pivotMode: boolean;
}

const StatTable = ({
  gridRef,
  rowData,
  columnDefs,
  onChartCreated,
  setHasChart,
  chartMenuItems,
  onColumnStateChange,
  onFiltersChange,
  onGridReady,
  pivotMode,
}: StatTableProps) => {
  const apiRef = useRef<GridApi | null>(null);

  useEffect(() => {
    console.log('[StatTable] component rendered');
  });

  return (
    <div className="w-full [&_.ag-paging-panel]:flex-wrap [&_.ag-paging-panel]:px-2 [&_.ag-paging-panel]:py-2">
      <div className="relative" id="chart-container">
        <AgGridReact
          ref={gridRef}
          enableCharts={true}
          chartMenuItems={chartMenuItems}
          rowData={rowData}
          columnDefs={columnDefs}
          domLayout="autoHeight"
          theme={myTheme}
          cellSelection={true}
          pivotMode={pivotMode}
          pagination={true}
          paginationPageSize={20}
          onFilterChanged={(e) => {
            onFiltersChange(e.api.getFilterModel());
          }}
          onSortChanged={(e) => {
            onColumnStateChange(e.api.getColumnState());
          }}
          onColumnResized={(e) => {
            onColumnStateChange(e.api.getColumnState());
          }}
          onColumnMoved={(e) => {
            const after = e.api.getColumnState();
            console.log('[Grid] Column moved');
            console.log('  After :', after);
            onColumnStateChange(after);
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
          onGridReady={(params) => {
            apiRef.current = params.api;
            onGridReady();
          }}
          onChartCreated={() => {
            onChartCreated?.();
          }}
          onChartDestroyed={() => {
            setHasChart(false);
          }}
        />
      </div>
    </div>
  );
};

export default StatTable;
