import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface StatHeaderProps {
  groupName: string;
  title: string;
  description?: string;
  hasChart: boolean;
  onSaveChart: () => void;
  view: 'table' | 'graphs';
  onChangeView: (view: 'table' | 'graphs') => void;
}

const StatHeader = ({
  groupName,
  title,
  description,
  hasChart,
  onSaveChart,
  view,
  onChangeView,
}: StatHeaderProps) => {
  return (
    <div className="grid grid-cols-3 items-center mb-2 pb-2">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-plank-blue transition"
          title="Torna indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="text-xl font-medium">{groupName}</div>
        <span className="text-base text-gray-700">{title}</span>
      </div>

      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => {
            if (value) onChangeView(value as 'table' | 'graphs');
          }}
          className="bg-gray-100 rounded-md"
        >
          <ToggleGroupItem
            value="table"
            className="px-4 py-2 text-sm data-[state=on]:bg-plank-pink data-[state=on]:text-white"
          >
            Tabella
          </ToggleGroupItem>
          <ToggleGroupItem
            value="graphs"
            className="px-4 py-2 text-sm data-[state=on]:bg-plank-pink data-[state=on]:text-white"
          >
            Grafici
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex justify-end items-center gap-3">
        {hasChart && (
          <button
            onClick={onSaveChart}
            className="px-4 py-2 rounded-md bg-plank-pink text-white text-sm hover:bg-pink-700 transition"
          >
            Salva grafico
          </button>
        )}
      </div>
    </div>
  );
};

export default StatHeader;
