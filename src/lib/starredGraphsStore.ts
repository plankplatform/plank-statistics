let cachedGraphs: any[] | null = null;
let cachedStatsById: Record<number, { columns: string[]; rows: any[] }> = {};

export const getStarredGraphs = () => ({
  graphs: cachedGraphs,
  statsById: cachedStatsById,
});

export const setStarredGraphs = (
  graphs: any[],
  statsById: Record<number, { columns: string[]; rows: any[] }>
) => {
  cachedGraphs = graphs;
  cachedStatsById = statsById;
};

export const invalidateStarredGraphs = () => {
  cachedGraphs = null;
  cachedStatsById = {};
};
