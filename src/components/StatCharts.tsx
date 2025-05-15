import { useEffect, useRef } from 'react';
import type { AgGridReact } from 'ag-grid-react';

interface StatChartsProps {
  model: any;
  gridRef: React.RefObject<AgGridReact<any> | null>;
}

const StatCharts = ({ model, gridRef }: StatChartsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const api = gridRef.current?.api;
    const container = containerRef.current;

    console.log('[StatCharts] Model:', model);
    console.log('[StatCharts] Grid API available:', !!api);
    console.log('[StatCharts] Container available:', !!container);

    if (api && container) {
      console.log('[StatCharts] Restoring chart...');
      console.log('Restoring chart with model:', model);
      console.log(
        'Available columns:',
        api.getColumns()?.map((c) => c.getColId())
      );
      console.log('Data row count:', api.getDisplayedRowCount());
      container.innerHTML = ''; // Pulisce eventuale contenuto precedente
      const chartRef = api.restoreChart(model, container);
      console.log('[StatCharts] Chart restored:', chartRef);
    } else {
      console.warn('[StatCharts] Missing API or container, cannot restore chart');
    }
  }, [model, gridRef]);

  return (
    <div className="w-full mt-4 mb-8">
      <div className="flex items-center justify-between mb-2"></div>
      <div ref={containerRef} className="border rounded p-4 bg-white" />
    </div>
  );
};

export default StatCharts;
