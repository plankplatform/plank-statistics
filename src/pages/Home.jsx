import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import Loader from '../components/Loader';
import Accordion from '../components/Accordion';

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
    <div className="px-8 py-10 w-5/6 mx-auto bg-white mt-12">
      <Accordion items={groups} />
    </div>
  );
};

export default Home;
