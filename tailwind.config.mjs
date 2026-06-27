/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Body / UI
        sans: ['Hanken Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        // Display / headings — the Aurora look
        display: ['Bricolage Grotesque', 'Hanken Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Aurora accent — teal → emerald. Mapped onto `brand` so every existing
        // brand-* usage across the site adopts the new palette automatically.
        brand: {
          50: '#e7f8f2',
          100: '#c7efe2',
          200: '#93e2cb',
          300: '#5fd0c0',
          400: '#14c79a',
          500: '#0fb88f',
          600: '#0a8f6e',
          700: '#08735a',
          800: '#075a47',
          900: '#064a3b',
          950: '#032a22',
        },
        // Aurora secondary accents (used in gradients / meshes).
        aurora: {
          teal: '#0fb88f',
          emerald: '#0a8f6e',
          aqua: '#5fd0c0',
          amber: '#ffb347',
          coral: '#ff7a59',
        },
      },
    },
  },
  plugins: [],
};
