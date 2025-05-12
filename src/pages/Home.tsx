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

type Stat = {
  id: string | number;
  title: string;
  description?: string;
};

type Group = {
  group: string;
  stats: Stat[];
};

const Home = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Group[]>('v1/stats/groups')
      .then(setGroups)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="px-8 py-10 w-5/6 mx-auto bg-white mt-12">
      <Accordion type="multiple" className="w-full space-y-4">
        {groups.map((group) => (
          <AccordionItem key={group.group} value={group.group}>
            <AccordionTrigger className="text-xl font-semibold text-gray-800">
              {group.group}
            </AccordionTrigger>
            <AccordionContent>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {group.stats.map((stat) => (
                  <Link
                    key={stat.id}
                    to={`/group/${encodeURIComponent(group.group)}/stat/${encodeURIComponent(
                      stat.title
                    )}`}
                    className="rounded-2xl border border-gray-200 bg-white shadow hover:shadow-lg transition-transform transform hover:scale-[1.02] block"
                  >
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900">{stat.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{stat.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default Home;
