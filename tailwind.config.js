// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.{html,js}', // Scans all html and js files in the project
    './injected_ui/**/*.{html,js}', // <-- Scans all files in the injected_ui folder*/
  ],
  theme: {
    extend: {
      colors: {
        // Add your custom CSS variables here so Tailwind can use them
        'cogni-blue': 'var(--cogni-blue)',
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
        'surface': 'var(--surface)',
        'secondary-surface': 'var(--secondary-surface)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'border-structure': 'var(--border-structure)',
      }
    },
  },
  plugins: [],
}