import { AgCharts } from 'ag-charts-react';
import type { AgChartOptions } from 'ag-charts-community';

const StatCharts = ({ options }: { options: AgChartOptions }) => {
  return (
    <div className="w-full mt-10 mb-12">
      <AgCharts options={options} />
    </div>
  );
};

export default StatCharts;
