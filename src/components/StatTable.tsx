import { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { myTheme } from '../styles/agTheme';
import { GridApi } from 'ag-grid-community';

interface StatTableProps {
  gridRef: React.RefObject<AgGridReact<any> | null>;
  rowData: Record<string, any>[];
  columnDefs: any[];
  onChartCreated?: () => void;
  setHasChart: (hasChart: boolean) => void;
}

const StatTable = ({
  gridRef,
  rowData,
  columnDefs,
  onChartCreated,
  setHasChart,
}: StatTableProps) => {
  const apiRef = useRef<GridApi | null>(null);

  return (
    <div className="w-full">
      <div className="relative" id="chart-container">
        <AgGridReact
          ref={gridRef}
          enableCharts={true}
          cellSelection={true}
          rowData={rowData}
          columnDefs={columnDefs}
          domLayout="autoHeight"
          theme={myTheme}
          pagination={true}
          paginationPageSize={20}
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
            params.api.sizeColumnsToFit();
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
