import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Stat {
  id: number | string;
  title: string;
  description?: string;
}

interface Group {
  group: string;
  stats: Stat[];
}

interface AccordionMenuProps {
  items: Group[];
  activeGroup?: string;
  activeStatId?: number | string;
}

export default function AccordionMenu({ items, activeGroup, activeStatId }: AccordionMenuProps) {
  const filtered = activeGroup ? items.filter((g) => g.group === activeGroup) : items;
  const defaultValue = activeGroup ? [activeGroup] : [];

  return (
    <Accordion type="multiple" defaultValue={defaultValue} className="w-full space-y-4">
      {filtered.map((group) => (
        <AccordionItem key={group.group} value={group.group}>
          <AccordionTrigger className="text-sm font-semibold">{group.group}</AccordionTrigger>

          <AccordionContent>
            <div className="mt-2 flex flex-col gap-2">
              {group.stats.map((stat) => {
                const isActive = String(stat.id) === String(activeStatId);

                return (
                  <Link
                    key={stat.id}
                    to={`/stat/${encodeURIComponent(stat.id)}`}
                    className={cn(
                      'text-left px-4 py-2 rounded transition-all',
                      'bg-gray-100 hover:bg-gray-200',
                      isActive && 'bg-[#E72175] text-white hover:bg-[#c51b63] font-semibold'
                    )}
                  >
                    {stat.title}
                  </Link>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
