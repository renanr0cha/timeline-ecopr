/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'maple-red': '#FF1E38',
        'pure-white': '#FFFFFF',
        
        // Secondary Colors
        'hope-red': '#FF6B7D',
        'snow-white': '#F8F9FA',
        
        // Accent Colors
        'maple-leaf': '#E31837',
        'frost': '#E9ECEF',
        
        // Status Colors
        'success': '#2E8540',
        'waiting': '#FDB813',
        'inactive': '#8C9196',
        
        // Text Colors
        'text-primary': '#1A1D1F',
        'text-secondary': '#4A4F54',
        'text-tertiary': '#6C757D',
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '30px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        lg: '0 4px 8px 0 rgba(0, 0, 0, 0.15)',
        xl: '0 8px 16px 0 rgba(0, 0, 0, 0.2)',
      },
      zIndex: {
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
      },
    },
  },
  plugins: [],
};
