import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'smc-card': '#161618',
        'smc-subtle': '#222225',
        'smc-border': '#2c2c30',
        'smc-gray': '#9ca3af',
        'smc-white': '#f9fafb',
      },
    },
  },
  plugins: [],
};

export default config;
