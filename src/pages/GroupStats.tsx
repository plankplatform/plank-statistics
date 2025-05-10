import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { myTheme } from '../styles/agTheme';
import Loader from '../components/Loader';
import { apiFetch } from '../lib/api';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import ExportMenu from '../components/ExportMenu';
import { IntegratedChartsModule } from 'ag-grid-enterprise';
import { ArrowLeft } from 'lucide-react';
import { AgCharts } from 'ag-charts-react';
import type { AgChartOptions } from 'ag-charts-community';

ModuleRegistry.registerModules([
  AllEnterpriseModule,
  IntegratedChartsModule.with(AgChartsEnterpriseModule),
]);

function castNumericValues(columns: string[], rows: Record<string, any>[]) {
  return rows.map((row) => {
    const newRow: Record<string, any> = { ...row };
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

interface RouteParams {
  groupName?: string;
  statName?: string;
}

const GroupStats: React.FC = () => {
  const params = useParams();
  const groupName = params.groupName ?? '';
  const statName = params.statName;
  const [data, setData] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<AgGridReact | null>(null);
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
            {
              type: 'bar',
              xKey: 'Operator',
              yKey: 'tot',
              yName: 'Tot',
            },
            {
              type: 'bar',
              xKey: 'Operator',
              yKey: 'inbound',
              yName: 'Inbound',
            },
            {
              type: 'bar',
              xKey: 'Operator',
              yKey: 'outbound',
              yName: 'Outbound',
            },
          ],
          legend: { enabled: true },
          axes: [
            { type: 'number', position: 'left', title: { text: 'Calls' } },
            { type: 'category', position: 'bottom', title: { text: 'Operator' } },
          ],
          title: {
            text: 'Operator Calls',
            fontSize: 18,
            fontWeight: 'bold',
          },
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
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-plank-blue transition"
                  title="Torna indietro"
                >
                  <ArrowLeft className="w-8 h-8" />
                </Link>
                <div className="text-3xl font-bold text-gray-800">{groupName}</div>
                <span className="text-xl text-gray-600">{stat.title}</span>
              </div>
              {stat.description && (
                <p className="text-sm text-gray-500 text-right">{stat.description}</p>
              )}
            </div>

            {groupName === 'CALL CENTER' && stat.title === 'Operator Calls' && (
              <div className="w-full mt-12 my-12">
                <AgCharts options={chartOptions} />
              </div>
            )}
            <div className="w-full">
              <AgGridReact
                ref={gridRef}
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
