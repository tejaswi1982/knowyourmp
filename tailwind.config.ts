import type { Config } from 'tailwindcss';

/**
 * The visual system.
 *
 * Sans-led and graphic before it is literary. Two grounds (near-black, chalk),
 * one signal colour (acid), one structural accent (cobalt). Type does the work;
 * texture appears at moments rather than coating the site.
 *
 * Contrast rule that the palette does not enforce on its own:
 *   acid is a GROUND for ink text, or a TEXT colour on ink. Never acid text on
 *   chalk (1.08:1). Cobalt is the link colour on chalk (6.6:1).
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B0C10', // near-black with a blue cast
          raised: '#15171E', // one step up, for blocks on ink
          line: '#262932',
        },
        chalk: {
          DEFAULT: '#F3F3EE', // clean off-white
          deep: '#E7E7DF',
          line: '#D2D2C8',
        },
        acid: '#D8F32B', // the signal. Sparing, always as ground or on ink.
        cobalt: '#2436E8', // structural accent and link colour on chalk
        slate: '#8C8C86', // meta grey, passes AA on both grounds at 14px+
      },
      fontFamily: {
        // Archivo Black  -  headline mass. Archivo  -  everything readable.
        // Barlow Condensed  -  the signage layer: codes, labels, provenance.
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sign: ['var(--font-sign)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        /**
         * Display scale.
         *
         * Line heights bottom out at 0.88. Archivo Black needs roughly 1.23em
         * of ascent plus descent, so anything tighter pushes glyphs outside
         * their line box  -  invisible until something clips, at which point
         * letters lose their tops. Vertical tightening is done with these
         * values, never with negative margins.
         */
        mega: ['clamp(3.75rem, 15.5vw, 14rem)', { lineHeight: '0.9', letterSpacing: '-0.045em' }],
        huge: ['clamp(2.75rem, 8.5vw, 7rem)', { lineHeight: '0.9', letterSpacing: '-0.035em' }],
        big: ['clamp(1.875rem, 4.6vw, 3.5rem)', { lineHeight: '0.98', letterSpacing: '-0.025em' }],
        mid: ['clamp(1.25rem, 2.4vw, 1.75rem)', { lineHeight: '1.18', letterSpacing: '-0.015em' }],
        // The data voice  -  a figure standing alone at scale.
        datum: ['clamp(3.25rem, 12vw, 11rem)', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
        'datum-sm': ['clamp(2.25rem, 6vw, 4.5rem)', { lineHeight: '0.92', letterSpacing: '-0.03em' }],
        // The signage voice.
        tag: ['0.6875rem', { lineHeight: '1.1', letterSpacing: '0.14em' }],
        'tag-lg': ['0.8125rem', { lineHeight: '1.1', letterSpacing: '0.12em' }],
      },
      maxWidth: {
        read: '62ch', // legal notes and long-form
        note: '46ch', // captions and caveats
        page: '120rem',
      },
      spacing: {
        gutter: 'var(--gutter)',
      },
      keyframes: {
        /**
         * Text arriving through a mask, not floating up through a fade.
         *
         * The element clips itself, so no wrapper needs `overflow: hidden`.
         * The rest state insets negatively on every side: display glyphs sit
         * outside their line box, and an end state of `inset(0)` would shave
         * ascenders and descenders once the animation settled.
         */
        'reveal-up': {
          from: { clipPath: 'inset(100% 0 0 0)' },
          to: { clipPath: 'inset(-30% -10% -30% -10%)' },
        },
        // A directional wipe, borrowed from signage flaps.
        'wipe-right': {
          from: { clipPath: 'inset(0 100% 0 0)' },
          to: { clipPath: 'inset(0 0 0 0)' },
        },
        // Discrete arrival for numerals  -  no easing tail, no slot machine.
        'snap-in': {
          '0%': { opacity: '0' },
          '40%': { opacity: '0' },
          '41%': { opacity: '1' },
          '100%': { opacity: '1' },
        },
        ticker: {
          from: { transform: 'translate3d(0,0,0)' },
          to: { transform: 'translate3d(-50%,0,0)' },
        },
      },
      animation: {
        'reveal-up': 'reveal-up 0.72s cubic-bezier(0.16, 1, 0.3, 1) both',
        'wipe-right': 'wipe-right 0.6s cubic-bezier(0.65, 0, 0.35, 1) both',
        'snap-in': 'snap-in 0.35s steps(2, end) both',
        ticker: 'ticker 38s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
