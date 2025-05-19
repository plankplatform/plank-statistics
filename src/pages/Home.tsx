import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import Loader from '../components/Loader';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/ui/accordion';
import { Link } from 'react-router-dom';
import StatChart from '../components/StatChart';

type RawGroupedStats = {
  [group: string]: {
    id: number | string;
    query_name: string;
    query_group: string;
    title: string;
    description?: string;
    footer?: string;
    frequency?: string;
    lastexec_time?: string;
    lastexec_duration?: number;
    query_type?: string;
  }[];
};

const Home = () => {
  const [groups, setGroups] = useState<
    { group: string; stats: { id: number; title: string; description?: string }[] }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [starredGraphs, setStarredGraphs] = useState<any[]>([]);
  const [statsById, setStatsById] = useState<Record<number, { columns: string[]; rows: any[] }>>(
    {}
  );
  const [loadingStarred, setLoadingStarred] = useState(true);

  useEffect(() => {
    apiFetch<RawGroupedStats>('v1/stats')
      .then((data) => {
        const transformed = Object.entries(data).map(([group, stats]) => ({
          group,
          stats: stats.map((s) => ({
            id: Number(s.id),
            title: s.title,
            description: s.description,
          })),
        }));
        setGroups(transformed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    apiFetch<any[]>('v1/stats/graphs/starred')
      .then((graphs) => {
        const parsed = graphs.map((graph) => {
          const config = typeof graph.config === 'string' ? JSON.parse(graph.config) : graph.config;
          const filters =
            typeof graph.filters === 'string' ? JSON.parse(graph.filters) : graph.filters;
          let sorting =
            typeof graph.sorting === 'string' ? JSON.parse(graph.sorting) : graph.sorting;
          //if (!Array.isArray(sorting)) sorting = [];
          if (sorting.length === 0) {
            console.warn(`Graph ${graph.id} ha sorting vuoto o non valido`);
          }

          return { ...graph, config, filters, sorting };
        });

        setStarredGraphs(parsed);

        const uniqueStatIds = [...new Set(parsed.map((g) => g.stat_id))];

        Promise.all(uniqueStatIds.map((id) => apiFetch(`v1/stats/${id}`)))
          .then((responses) => {
            const mapping: Record<number, { columns: string[]; rows: any[] }> = {};

            responses.forEach((raw) => {
              const columns = JSON.parse(raw.columns_order || '[]');
              const rows = JSON.parse(raw.json_results || '[]');
              mapping[raw.id] = { columns, rows };
            });

            setStatsById(mapping);
          })
          .catch(console.error);
      })
      .catch(console.error)
      .finally(() => setLoadingStarred(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="px-8 py-10 max-w-[1400px] mx-auto mt-12 grid grid-cols-12 gap-10">
      <div className="col-span-4">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="https://www.plank.global/public/favicon.ico"
            alt="Plank Logo"
            className="w-8 h-8"
          />
          <h1 className="text-2xl text-gray-800 font-semibold">Plank Statistics</h1>
        </div>
        {groups.length === 0 ? (
          <div className="text-gray-500 text-sm text-center italic mt-24">
            Non sono presenti statistiche.
          </div>
        ) : (
          <Accordion type="multiple" className="w-full space-y-6">
            {groups.map((group) => (
              <AccordionItem key={group.group} value={group.group}>
                <AccordionTrigger className="text-lg text-black hover:text-gray-800 transition-colors">
                  {group.group}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mt-4 flex flex-col gap-2">
                    {group.stats.map((stat) => (
                      <Link
                        key={stat.id}
                        to={`/group/${encodeURIComponent(group.group)}/stat/${encodeURIComponent(
                          stat.id
                        )}`}
                        className="text-left px-6 py-4 bg-gray-100 hover:bg-gray-200 hover:shadow-sm transition-all block rounded-lg"
                      >
                        <div className="text-black text-base">{stat.title}</div>
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <div className="col-span-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Grafici preferiti</h2>
        {loadingStarred ? (
          <Loader />
        ) : starredGraphs.length === 0 ? (
          <p className="text-sm italic text-gray-500">Nessun grafico preferito</p>
        ) : (
          <div className="space-y-6">
            {starredGraphs.map((graph) => {
              const stat = statsById[graph.stat_id];
              if (!stat) return null;

              console.log('Stat:', stat);
              console.log('Graph:', graph);

              return (
                <StatChart
                  key={graph.id}
                  chartId={graph.id}
                  title={graph.title}
                  model={graph.config}
                  filters={graph.filters}
                  sorting={graph.sorting}
                  isStarred={graph.is_starred}
                  data={stat.rows}
                  columns={stat.columns}
                  onDelete={() => {
                    setStarredGraphs((prev) => prev.filter((g) => g.id !== graph.id));
                  }}
                  updateCachedGraph={(graphId, updatedData) => {
                    setStarredGraphs((prev) =>
                      prev.map((g) => (g.id === graphId ? { ...g, ...updatedData } : g))
                    );
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
