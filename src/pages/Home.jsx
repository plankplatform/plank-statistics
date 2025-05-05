import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import GroupCard from '../components/GroupCard';

const Home = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    apiFetch('v1/stats/groups').then(setGroups).catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Statistiche disponibili</h1>
      <div className="grid gap-6">
        {groups.map((group) => (
          <GroupCard key={group.group} group={group.group} stats={group.stats} />
        ))}
      </div>
    </div>
  );
};

export default Home;
