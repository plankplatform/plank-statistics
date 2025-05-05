import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { myTheme } from '../styles/agTheme';

ModuleRegistry.registerModules([AllCommunityModule]);

import { apiFetch } from '../lib/api';

const GroupStats = () => {
  const { groupName, statName } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`v1/stats?group=${encodeURIComponent(groupName)}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupName]);

  if (loading) return <div className="p-8">Caricamento...</div>;

  const filteredData = statName ? data.filter((s) => s.title === statName) : data;

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      <Link to="/" className="text-blue-600 underline">
        ← Torna indietro
      </Link>
      <h1 className="text-3xl font-bold mb-6 mt-4">{groupName}</h1>
      {filteredData.map((stat, idx) => (
        <div key={idx} className="mb-16 pt-10 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-2">{stat.title}</h2>
          {stat.description && <p className="mb-2 text-gray-600">{stat.description}</p>}
          <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
            <AgGridReact
              rowData={stat.rows}
              columnDefs={stat.columns.map((c) => ({
                field: c,
                filter: true,
                sortable: true,
              }))}
              domLayout="autoHeight"
              theme={myTheme}
              pagination={true}
              paginationPageSize={25}
              onGridReady={(params) => params.api.sizeColumnsToFit()}
            />
          </div>
          {stat.footer && <p className="mt-2 text-sm text-gray-500">{stat.footer}</p>}
        </div>
      ))}
    </div>
  );
};

export default GroupStats;
