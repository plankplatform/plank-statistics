import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { myTheme } from '../styles/agTheme';
import Loader from '../components/Loader';
import { useRef } from 'react';
import { apiFetch } from '../lib/api';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import ExportMenu from '../components/ExportMenu';
import { IntegratedChartsModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
  AllEnterpriseModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
]);

function castNumericValues(columns, rows) {
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

const GroupStats = () => {
  const { groupName, statName } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    apiFetch(`v1/stats?group=${encodeURIComponent(groupName)}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupName]);

  if (loading) return <Loader />;

  const filteredData = statName ? data.filter((s) => s.title === statName) : data;

  return (
    <div className="px-6 py-8 w-5/6 mx-auto">
      <Link to="/" className="text-blue-600 underline">
        ← Torna indietro
      </Link>
      <div className="text-5xl font-bold mb-6 mt-4">{groupName}</div>
      {filteredData.map((stat, idx) => {
        const castedRows = castNumericValues(stat.columns, stat.rows);
        const columnDefs = stat.columns.map((col) => {
          const isNumeric = castedRows.every((row) => typeof row[col] === 'number');
          return {
            field: col,
            filter: true,
            sortable: true,
            type: isNumeric ? 'numericColumn' : undefined,
          };
        });

        return (
          <div key={idx} className="mb-16 pt-10 border-t border-gray-200">
            <div className="text-3xl font-semibold mb-2">{stat.title}</div>
            {stat.description && <p className="mb-2 text-gray-600">{stat.description}</p>}

            <div className="flex justify-end mb-4">
              <ExportMenu
                gridRef={gridRef}
                filename={`${groupName}-${stat.title}`}
                sheetName={stat.title}
              />
            </div>

            <div className="ag-theme-alpine mb-12" style={{ width: '100%' }}>
              <AgGridReact
                ref={gridRef}
                enableContextMenu={true}
                enableCharts={true}
                cellSelection={true}
                rowData={castedRows}
                columnDefs={columnDefs}
                domLayout="autoHeight"
                theme={myTheme}
                pagination={true}
                paginationPageSize={25}
                onGridReady={(params) => params.api.sizeColumnsToFit()}
              />
            </div>
            {stat.footer && <p className="mt-2 text-sm text-gray-500">{stat.footer}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default GroupStats;
