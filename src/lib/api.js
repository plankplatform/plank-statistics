const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiFetch = async (path, options = {}) => {
  const token = sessionStorage.getItem('apitoken');

  const response = await fetch(`${BASE_URL}/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Request failed: ${response.status} ${error}`);
  }

  return response.json();
};
