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
  id: number | string;
  title: string;
  description?: string;
  footer?: string;
  columns: string[];
  rows: Record<string, any>[];
}

const Stat = () => {
  const params = useParams();
  const groupName = params.groupName ?? '';
  const statId = Number(params.statId ?? '');
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewChart, setViewChart] = useState(false);
  const [chartOptions, setChartOptions] = useState<AgChartOptions>({
    data: [],
    series: [],
  });
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    if (isNaN(statId)) return;

    setLoading(true);

    apiFetch(`v1/stats/${statId}`)
      .then((raw: any) => {
        const columns: string[] = JSON.parse(raw.columns_order || '[]');
        const rows: Record<string, any>[] = JSON.parse(raw.json_results || '[]');
        const castedRows = castNumericValues(columns, rows);

        const stat: StatData = {
          id: raw.id,
          title: raw.title,
          description: raw.description,
          footer: raw.footer,
          columns,
          rows: castedRows,
        };

        setData(stat);

        setChartOptions({
          data: castedRows,
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
          title: { text: raw.title, fontSize: 18, fontWeight: 'bold' },
          height: 600,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statId]);

  if (loading) return <Loader />;
  if (!data) return <p className="text-center text-gray-600 mt-12">Statistica non trovata</p>;

  const columnDefs = data.columns.map((col) => {
    const isNumeric = data.rows.every((row) => typeof row[col] === 'number');
    return {
      field: col,
      filter: isNumeric ? 'agNumberColumnFilter' : 'agTextColumnFilter',
      sortable: true,
      type: isNumeric ? 'numericColumn' : undefined,
    };
  });

  return (
    <div className="px-6 py-4 w-5/6 mx-auto">
      <div className="mb-8 pt-8">
        <StatHeader
          groupName={groupName}
          title={data.title}
          description={data.description}
          viewChart={viewChart}
          onToggle={setViewChart}
        />
        {viewChart && groupName === 'CALL CENTER' && data.title === 'Operator Calls' ? (
          <StatCharts options={chartOptions} />
        ) : (
          <StatTable gridRef={gridRef} rowData={data.rows} columnDefs={columnDefs} />
        )}
        {data.footer && <p className="mt-2 text-sm text-muted-foreground">{data.footer}</p>}
      </div>
    </div>
  );
};

export default Stat;
