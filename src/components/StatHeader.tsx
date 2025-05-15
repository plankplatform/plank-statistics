import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatHeaderProps {
  groupName: string;
  title: string;
  description?: string;
  onSaveChart: () => void;
  hasChart: boolean;
}

const StatHeader = ({ groupName, title, description, onSaveChart, hasChart }: StatHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4 pb-4">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-plank-blue transition"
          title="Torna indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="text-2xl font-medium">{groupName}</div>
        <span className="text-lg text-gray-700">{title}</span>
      </div>
      <div className="flex items-center gap-3">
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
