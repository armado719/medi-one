import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#C8857A',
          light: '#E8B4AD',
          dark: '#9B5E58',
        },
        bg: {
          base: '#F8F4F3',
          surface: '#FDF0EE',
        },
        content: {
          DEFAULT: '#3D1F1C',
          muted: '#7A5A58',
        },
        border: '#E8D5D3',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-jakarta)', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        sm: '0 1px 3px 0 rgba(61,31,28,0.08)',
        md: '0 4px 12px 0 rgba(61,31,28,0.1)',
      },
    },
  },
  plugins: [],
}

export default config
