import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule, IntegratedChartsModule } from 'ag-grid-enterprise';
import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
import { AgGridReact } from 'ag-grid-react';
import { apiFetch } from '../lib/api';
import Loader from '../components/Loader';
import StatHeader from '../components/StatHeader';
import StatChart from '../components/StatChart';
import StatTable from '../components/StatTable';
import SaveChartModal from '../components/SaveChartModal';
import type { ChartModel } from 'ag-grid-community';

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

function normalizeChartOptions(model: ChartModel): ChartModel {
  if (Array.isArray(model.chartOptions)) {
    model.chartOptions = {};
  }
  return model;
}

async function createStatGraph(payload: CreateStatGraphPayload): Promise<{ id: number }> {
  return apiFetch('v1/stats/graphs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

interface CreateStatGraphPayload {
  title: string;
  stat_id: number | string;
  config: ChartModel;
}

interface StatData {
  id: number | string;
  title: string;
  description?: string;
  footer?: string;
  columns: string[];
  rows: Record<string, any>[];
}

const StatPage = () => {
  const params = useParams();
  const statId = Number(params.statId ?? '');
  const groupName = params.groupName ?? '';

  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'graphs'>('table');
  const [hasChart, setHasChart] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastChartModel, setLastChartModel] = useState<ChartModel | null>(null);
  const [lastChartFilter, setLastChartFilter] = useState<any>(null);
  const [savedGraphs, setSavedGraphs] = useState<any[]>([]);
  const [graphsLoading, setGraphsLoading] = useState(false);
  const gridRef = useRef<AgGridReact>(null);

  useEffect(() => {
    if (isNaN(statId)) return;
    setLoading(true);

    apiFetch(`v1/stats/${statId}`)
      .then((raw: any) => {
        const columns = JSON.parse(raw.columns_order || '[]');
        const rows = castNumericValues(columns, JSON.parse(raw.json_results || '[]'));

        setData({
          id: Number(raw.id),
          title: raw.title,
          description: raw.description,
          footer: raw.footer,
          columns,
          rows,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statId]);

  useEffect(() => {
    if (view !== 'graphs' || !data || savedGraphs.length > 0) return;

    setGraphsLoading(true);
    apiFetch<any[]>(`v1/stats/graphs?stat_id=${data.id}`)
      .then((res) => {
        const parsed = res.map((graph) => {
          const config = typeof graph.config === 'string' ? JSON.parse(graph.config) : graph.config;
          return { ...graph, config: normalizeChartOptions(config) };
        });
        setSavedGraphs(parsed);
      })
      .catch(console.error)
      .finally(() => setGraphsLoading(false));
  }, [view, data]);

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

  const handleSaveChart = () => {
    const api = gridRef.current?.api;
    const models = api?.getChartModels() || [];
    const filters = api?.getFilterModel() || [];
    if (!models.length || !api) {
      alert('Nessun grafico da salvare.');
      return;
    }

    const lastModel = models[models.length - 1];
    setLastChartModel({ ...lastModel });
    setLastChartFilter(filters);
    setShowModal(true);
  };

  const handleConfirmSave = (title: string) => {
    if (!lastChartModel || !data) return;

    const payload = {
      title,
      config: normalizeChartOptions(lastChartModel),
      filters: lastChartFilter,
      stat_id: data.id,
    };

    createStatGraph(payload)
      .then((res) => console.log('Grafico salvato con ID:', res.id))
      .catch((err) => {
        console.error('Errore durante il salvataggio:', err);
        alert('Errore durante il salvataggio del grafico');
      })
      .finally(() => setShowModal(false));
  };

  return (
    <div className="px-6 py-4 w-5/6 mx-auto">
      <div className="mb-8 pt-8">
        <StatHeader
          groupName={groupName}
          title={data.title}
          description={data.description}
          hasChart={view === 'table' && hasChart}
          onSaveChart={handleSaveChart}
          view={view}
          onChangeView={setView}
        />

        <div className={view === 'table' ? '' : 'hidden'}>
          <StatTable
            gridRef={gridRef}
            rowData={data.rows}
            columnDefs={columnDefs}
            onChartCreated={() => setHasChart(true)}
            setHasChart={setHasChart}
          />
        </div>

        {view === 'graphs' &&
          (graphsLoading ? (
            <Loader />
          ) : savedGraphs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center italic mt-24">
              Non ci sono grafici salvati per questa statistica.
            </p>
          ) : (
            <div className="space-y-12 mt-10">
              {savedGraphs.map((graph) => (
                <div key={graph.id}>
                  <h3 className="text-base font-semibold mb-2 text-gray-700">{graph.title}</h3>
                  <StatChart
                    filters={graph.filters}
                    model={graph.config}
                    data={data.rows}
                    columns={data.columns}
                  />
                </div>
              ))}
            </div>
          ))}

        {showModal && lastChartModel && (
          <SaveChartModal onClose={() => setShowModal(false)} onSave={handleConfirmSave} />
        )}
      </div>
    </div>
  );
};

export default StatPage;
