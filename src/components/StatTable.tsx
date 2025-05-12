import { AgGridReact } from 'ag-grid-react';
import { myTheme } from '../styles/agTheme';

interface StatTableProps {
  gridRef: React.RefObject<AgGridReact<any> | null>;
  rowData: Record<string, any>[];
  columnDefs: any[];
  theme: string;
}

const StatTable = ({ gridRef, rowData, columnDefs }: StatTableProps) => {
  return (
    <div className="w-full">
      <AgGridReact
        ref={gridRef}
        enableCharts={true}
        cellSelection={true}
        rowData={rowData}
        columnDefs={columnDefs}
        domLayout="autoHeight"
        theme={myTheme}
        pagination={true}
        paginationPageSize={25}
        onGridReady={(params) => params.api.sizeColumnsToFit()}
      />
    </div>
  );
};

export default StatTable;
