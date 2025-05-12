/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  theme: {
    extend: {
      colors: {
        'plank-blue': '#2d2e83',
        'plank-pink': '#e72175',
        'plank-gray': '#f9f9f9',
      },
    },
  },
  plugins: [],
};
