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

async function createStatGraph(payload: CreateStatGraphPayload): Promise<{ id: number }> {
  return apiFetch('v1/stats/graphs', {
    method: 'POST',
    body: JSON.stringify(payload),
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

interface CreateStatGraphPayload {
  stat_id: number | string;
  title: string;
  config: object;
}

const Stat = () => {
  const params = useParams();
  const groupName = params.groupName ?? '';
  const statId = Number(params.statId ?? '');

  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'graphs'>('table');
  const [hasChart, setHasChart] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastChartModel, setLastChartModel] = useState<ChartModel | null>(null);
  const [savedGraphs, setSavedGraphs] = useState<any[]>([]);
  const [graphsLoading, setGraphsLoading] = useState(false);
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
          id: Number(raw.id),
          title: raw.title,
          description: raw.description,
          footer: raw.footer,
          columns,
          rows: castedRows,
        };

        setData(stat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statId]);

  useEffect(() => {
    if (view === 'graphs' && data && savedGraphs.length === 0) {
      setGraphsLoading(true);

      apiFetch<any[]>(`v1/stats/graphs?stat_id=${Number(data.id)}`)
        .then((res) => {
          const parsed = res.map((graph) => ({
            ...graph,
            config: typeof graph.config === 'string' ? JSON.parse(graph.config) : graph.config,
          }));
          setSavedGraphs(parsed);
        })
        .catch((err) => {
          console.error('Errore nel caricamento dei grafici salvati:', err);
        })
        .finally(() => setGraphsLoading(false));
    }
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

  return (
    <div className="px-6 py-4 w-5/6 mx-auto">
      <div className="mb-8 pt-8">
        <StatHeader
          groupName={groupName}
          title={data.title}
          description={data.description}
          hasChart={hasChart}
          onSaveChart={() => {
            const models = gridRef.current?.api.getChartModels() || [];
            if (!models.length) {
              alert('Nessun grafico da salvare.');
              return;
            }

            const lastModel = models[models.length - 1];
            setLastChartModel(lastModel);
            setShowModal(true);
          }}
          view={view}
          onChangeView={setView}
        />

        {/* Griglia sempre montata, ma nascosta se non selezionata */}
        <div className={view === 'table' ? '' : ''}>
          <StatTable
            gridRef={gridRef}
            rowData={data.rows}
            columnDefs={columnDefs}
            onChartCreated={() => setHasChart(true)}
          />
        </div>

        {/* Sezione grafici */}
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
                  <StatCharts model={graph} gridRef={gridRef} />
                </div>
              ))}
            </div>
          ))}
      </div>

      {showModal && lastChartModel && (
        <SaveChartModal
          onClose={() => setShowModal(false)}
          onSave={(title) => {
            const payload: CreateStatGraphPayload = {
              title,
              config: lastChartModel,
              stat_id: data.id,
            };

            createStatGraph(payload)
              .then((res) => {
                console.log('Grafico salvato con ID:', res.id);
              })
              .catch((err) => {
                console.error('Errore durante il salvataggio:', err);
                alert('Errore durante il salvataggio del grafico');
              })
              .finally(() => setShowModal(false));
          }}
        />
      )}
    </div>
  );
};

export default Stat;
