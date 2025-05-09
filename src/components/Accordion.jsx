import { useState } from 'react';
import { Link } from 'react-router-dom';

const Accordion = ({ items }) => {
  const [openGroups, setOpenGroups] = useState(new Set());

  const toggleGroup = (groupName) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  return (
    <div className="w-full space-y-6">
      {items.map((group) => (
        <div
          key={group.group}
          className="rounded-2xl bg-gray-100 shadow-sm hover:shadow-md transition-shadow px-6 py-4 select-none"
        >
          <button
            onClick={() => toggleGroup(group.group)}
            className="w-full flex justify-between items-center text-left text-xl font-semibold text-gray-800 focus:outline-none"
            style={{ userSelect: 'none' }}
          >
            {group.group}
            <span
              className={`transition-transform text-gray-500 ${
                openGroups.has(group.group) ? 'rotate-180' : ''
              }`}
            >
              ▼
            </span>
          </button>

          {openGroups.has(group.group) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {group.stats.map((stat) => (
                <Link
                  key={stat.id}
                  to={`/group/${encodeURIComponent(group.group)}/stat/${encodeURIComponent(
                    stat.title
                  )}`}
                  className="rounded-2xl border border-gray-200 bg-white shadow hover:shadow-lg transition-transform transform hover:scale-[1.02] block"
                >
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900">{stat.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{stat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Accordion;
