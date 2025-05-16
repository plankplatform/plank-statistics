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

type Group = {
  group: string;
  stats: {
    id: number | string;
    title: string;
    description?: string;
  }[];
};

const Home = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<RawGroupedStats>('v1/stats')
      .then((data) => {
        const transformed: Group[] = Object.entries(data).map(([group, stats]) => ({
          group,
          stats: stats.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
          })),
        }));
        setGroups(transformed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="px-8 py-10 max-w-4xl font-medium mx-auto mt-12">
      <div className="flex items-center justify-center gap-4 mb-8">
        <img
          src="https://www.plank.global/public/favicon.ico"
          alt="Plank Logo"
          className="w-8 h-8"
        />
        <h1 className="text-4xl text-gray-800">Plank Statistics</h1>
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
                      {/* <div className="text-gray-500 text-sm mt-1">
                      {stat.description || 'Ultimo aggiornamento: 02/05/2025'}
                    </div> */}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default Home;
