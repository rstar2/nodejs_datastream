import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

const outputESM = false;

export default {
  input: 'src/main.js',
  output: {
    dir: 'public/js',

    // IIFE (immediately-invoked function expression) - suitable for <script> tags
    //     and only supported for single bundle, NOT when Code-splitting builds
    // ESM (Es modules) suitable for <script type="module"> tags
    format: outputESM ? 'esm' : 'iife',

    sourcemap: production && true,
  },
  // code-splitting is NOT allowed for single bundle
  manualChunks: outputESM
    ? {
        vendor: ['node_modules/highcharts/highcharts.js'],
      }
    : undefined,
  plugins: [
    resolve(), // find and resolve any Node commonjs module
    commonjs(), // converts to ES modules
    production && terser(), // minify, but only in production,
  ],
};
