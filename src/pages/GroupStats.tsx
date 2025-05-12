import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, IntegratedChartsModule } from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import { AgChartOptions } from 'ag-charts-community';
import { AgGridReact } from 'ag-grid-react';
import { apiFetch } from '../lib/api';
import Loader from '../components/Loader';
import StatHeader from '../components/StatHeader';
import StatCharts from '../components/StatCharts';
import StatTable from '../components/StatTable';

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

interface StatData {
  title: string;
  description?: string;
  footer?: string;
  columns: string[];
  rows: Record<string, any>[];
}

const GroupStats = () => {
  const params = useParams();
  const groupName = params.groupName ?? '';
  const statName = params.statName;
  const [data, setData] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<AgGridReact>(null);
  const [viewChart, setViewChart] = useState(false);
  const [chartOptions, setChartOptions] = useState<AgChartOptions>({
    data: [],
    series: [],
  });

  useEffect(() => {
    setLoading(true);
    apiFetch(`v1/stats?group=${encodeURIComponent(groupName)}`)
      .then((rawData: StatData[]) => {
        const transformed = rawData.map((stat) => ({
          ...stat,
          rows: castNumericValues(stat.columns, stat.rows),
        }));
        setData(transformed);

        const allRows = transformed.flatMap((stat) => stat.rows);
        setChartOptions({
          data: allRows.slice(0, 10),
          series: [
            { type: 'bar', xKey: 'Operator', yKey: 'tot', yName: 'Tot' },
            { type: 'bar', xKey: 'Operator', yKey: 'inbound', yName: 'Inbound' },
            { type: 'bar', xKey: 'Operator', yKey: 'outbound', yName: 'Outbound' },
          ],
          legend: { enabled: true },
          axes: [
            { type: 'number', position: 'left', title: { text: 'Calls' } },
            { type: 'category', position: 'bottom', title: { text: 'Operator' } },
          ],
          title: { text: 'Operator Calls', fontSize: 18, fontWeight: 'bold' },
          height: 500,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupName]);

  if (loading) return <Loader />;

  const filteredData = statName ? data.filter((s) => s.title === statName) : data;

  return (
    <div className="px-6 py-4 w-5/6 mx-auto">
      {filteredData.map((stat, idx) => {
        const castedRows = stat.rows;
        const columnDefs = stat.columns.map((col) => {
          const isNumeric = castedRows.every((row) => typeof row[col] === 'number');
          return {
            field: col,
            filter: isNumeric ? 'agNumberColumnFilter' : 'agTextColumnFilter',
            sortable: true,
            type: isNumeric ? 'numericColumn' : undefined,
          };
        });

        return (
          <div key={idx} className="mb-8 pt-8 border-t border-gray-200">
            <StatHeader
              groupName={groupName}
              title={stat.title}
              description={stat.description}
              viewChart={viewChart}
              onToggle={setViewChart}
            />
            {viewChart && groupName === 'CALL CENTER' && stat.title === 'Operator Calls' && (
              <StatCharts options={chartOptions} />
            )}
            {!viewChart && (
              <StatTable gridRef={gridRef} rowData={castedRows} columnDefs={columnDefs} />
            )}
            {stat.footer && <p className="mt-2 text-sm text-muted-foreground">{stat.footer}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default GroupStats;
