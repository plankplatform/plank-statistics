import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
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
    <div className="px-8 py-10 w-5/6 mx-auto bg-white mt-12">
      {groups.map((group) => (
        <div key={group.group} className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{group.group}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {group.stats.map((stat) => (
              <Link
                key={stat.id}
                to={`/group/${encodeURIComponent(group.group)}/stat/${encodeURIComponent(
                  stat.title
                )}`}
                className="rounded-2xl border border-gray-200 bg-gray-50 shadow-md hover:shadow-lg transition-transform transform hover:scale-[1.02] block"
              >
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900">{stat.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{stat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;
