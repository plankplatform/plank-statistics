import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as SwitchPrimitive from '@radix-ui/react-switch';

interface StatHeaderProps {
  groupName: string;
  title: string;
  description?: string;
  viewChart: boolean;
  onToggle: (checked: boolean) => void;
}

const StatHeader = ({ groupName, title, description, viewChart, onToggle }: StatHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-4">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-plank-blue transition"
          title="Torna indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="text-2xl font-bold text-plank-blue">{groupName}</div>
        <span className="text-lg text-gray-700">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor="toggle-chart" className="text-sm text-gray-600">
          View chart
        </label>
        <SwitchPrimitive.Root
          id="toggle-chart"
          checked={viewChart}
          onCheckedChange={onToggle}
          className="relative w-11 h-6 bg-gray-300 data-[state=checked]:bg-plank-blue rounded-full outline-none transition-colors"
        >
          <SwitchPrimitive.Thumb className="block w-5 h-5 bg-white rounded-full shadow transition-transform translate-x-0 data-[state=checked]:translate-x-5" />
        </SwitchPrimitive.Root>
      </div>
    </div>
  );
};

export default StatHeader;
