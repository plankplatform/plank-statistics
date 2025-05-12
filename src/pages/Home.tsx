import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import Loader from '../components/Loader';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from 'lucide-react';
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
      <AccordionPrimitive.Root type="multiple" className="w-full space-y-6">
        {groups.map((group) => (
          <AccordionPrimitive.Item
            key={group.group}
            value={group.group}
            className="border border-gray-200 rounded-xl"
          >
            <AccordionPrimitive.Header>
              <AccordionPrimitive.Trigger className="flex justify-between items-center w-full px-4 py-3 text-2xl font-bold text-plank-blue hover:text-plank-pink transition-colors">
                {group.group}
                <ChevronDownIcon className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="px-4 pb-4 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="mt-4 flex flex-col gap-3">
                {group.stats.map((stat) => (
                  <Link
                    key={stat.id}
                    to={`/group/${encodeURIComponent(group.group)}/stat/${encodeURIComponent(
                      stat.title
                    )}`}
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
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  );
};

export default Home;
