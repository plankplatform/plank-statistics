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
    <div className="px-8 py-10 w-5/6 mx-auto mt-12">
      <Accordion type="multiple" className="w-full space-y-6">
        {groups.map((group) => (
          <AccordionItem key={group.group} value={group.group}>
            <AccordionTrigger className="text-2xl font-bold text-plank-blue hover:text-plank-pink transition-colors">
              {group.group}
            </AccordionTrigger>
            <AccordionContent>
              <div className="mt-4 flex flex-col gap-3">
                {group.stats.map((stat) => (
                  <Link
                  key={stat.id}
                  to={`/group/${encodeURIComponent(group.group)}/stat/${encodeURIComponent(stat.title)}`}
                  className="text-left px-6 py-4 rounded-xl bg-plank-blue/5 hover:bg-plank-pink/10 transition-colors block"
                >
                  <div className="text-plank-blue font-semibold text-lg no-underline hover:no-underline">
                    {stat.title}
                  </div>
                  {stat.description && (
                    <div className="text-gray-700 text-sm mt-1 no-underline hover:no-underline">
                      {stat.description}
                    </div>
                  )}
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
