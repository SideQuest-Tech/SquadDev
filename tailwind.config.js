/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  corePlugins: {
    // Disable Preflight so Tailwind's CSS reset doesn't override existing styles.css
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
