// src/components/GroupCard.jsx
import { Link } from 'react-router-dom';

const GroupCard = ({ group, stats }) => {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">{group}</h2>
      <ul className="space-y-1">
        {stats.map((stat) => (
          <li key={stat.id}>
            <Link
              to={`/group/${encodeURIComponent(group)}/stat/${encodeURIComponent(stat.title)}`}
              className="text-blue-600 hover:underline"
            >
              {stat.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupCard;
