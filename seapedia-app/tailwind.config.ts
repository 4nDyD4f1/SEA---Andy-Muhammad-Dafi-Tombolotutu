import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // SEAPEDIA Design System Colors
        primary: '#005baf',
        'on-primary': '#ffffff',
        'primary-container': '#0074db',
        'on-primary-container': '#fefcff',
        'inverse-primary': '#a8c8ff',
        'primary-fixed': '#d5e3ff',
        'primary-fixed-dim': '#a8c8ff',
        'on-primary-fixed': '#001b3c',
        'on-primary-fixed-variant': '#004689',

        secondary: '#ab3500',
        'on-secondary': '#ffffff',
        'secondary-container': '#fe6a34',
        'on-secondary-container': '#5d1900',
        'secondary-fixed': '#ffdbd0',
        'secondary-fixed-dim': '#ffb59d',
        'on-secondary-fixed': '#390c00',
        'on-secondary-fixed-variant': '#832600',

        tertiary: '#006859',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#008471',
        'on-tertiary-container': '#f4fffa',
        'tertiary-fixed': '#68fadd',
        'tertiary-fixed-dim': '#44ddc1',
        'on-tertiary-fixed': '#00201a',
        'on-tertiary-fixed-variant': '#005145',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        background: '#f9f9fc',
        'on-background': '#1a1c1e',

        surface: '#f9f9fc',
        'surface-dim': '#dadadc',
        'surface-bright': '#f9f9fc',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f6',
        'surface-container': '#eeeef0',
        'surface-container-high': '#e8e8ea',
        'surface-container-highest': '#e2e2e5',
        'on-surface': '#1a1c1e',
        'on-surface-variant': '#404754',
        'surface-variant': '#e2e2e5',
        'surface-tint': '#005eb3',

        outline: '#717785',
        'outline-variant': '#c0c6d6',

        'inverse-surface': '#2f3133',
        'inverse-on-surface': '#f0f0f3',

        // Semantic
        'sea-blue': '#005baf',
        coral: '#fe6a34',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'title-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.05em' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        base: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        gutter: '16px',
        'margin-mobile': '16px',
        'margin-desktop': '24px',
        'max-width': '1280px',
      },
      boxShadow: {
        card: '0 4px 12px rgba(0,0,0,0.05)',
        float: '0 8px 20px rgba(0,0,0,0.08)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 1s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      maxWidth: {
        'app': '1280px',
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
      },
    },
  },
  plugins: [],
}

export default config
