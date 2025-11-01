import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        primary: '#FFE11C',
        accent: '#00BF7F',
        text: '#000000',
        dark: '#000000'
      }
    }
  },
  plugins: []
};

export default config;


