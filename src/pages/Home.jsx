import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import GroupCard from '../components/GroupCard';
import Loader from '../components/Loader';

const Home = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('v1/stats/groups')
      .then(setGroups)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="p-8 w-5/6 mx-auto">
      <h1 className="text-5xl text-red-500 font-extrabold mb-6">Statistiche disponibili:</h1>
      <div className="grid gap-6">
        {groups.map((group) => (
          <GroupCard key={group.group} group={group.group} stats={group.stats} />
        ))}
      </div>
    </div>
  );
};

export default Home;
