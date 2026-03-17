export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        secondary: '#ffc107',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
