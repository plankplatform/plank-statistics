import { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { myTheme } from '../styles/agTheme';
import { GridApi } from 'ag-grid-community';

interface StatTableProps {
  gridRef: React.RefObject<AgGridReact<any> | null>;
  rowData: Record<string, any>[];
  columnDefs: any[];
  onChartCreated?: () => void;
}

const StatTable = ({ gridRef, rowData, columnDefs, onChartCreated }: StatTableProps) => {
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
          onGridReady={(params) => {
            apiRef.current = params.api;
            params.api.sizeColumnsToFit();
          }}
          onChartCreated={() => {
            onChartCreated?.();
          }}
        />
      </div>
    </div>
  );
};

export default StatTable;
