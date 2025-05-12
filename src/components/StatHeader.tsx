import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-plank-blue transition"
          title="Torna indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="text-2xl font-bold text-foreground">{groupName}</div>
        <span className="text-lg text-muted-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <Label htmlFor="toggle-chart" className="text-sm text-muted-foreground">
          View chart
        </Label>
        <Switch id="toggle-chart" checked={viewChart} onCheckedChange={onToggle} />
      </div>
    </div>
  );
};

export default StatHeader;
