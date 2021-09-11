import resolve from '@rollup/plugin-node-resolve';
// import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

const outputESM = false;

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/main.js',
  output: {
    //dir: 'public/js',
    file: 'public/js/bundle.js',

    // IIFE (immediately-invoked function expression) - suitable for <script> tags
    //     and only supported for single bundle, NOT with Code-splitting builds
    // ESM (Es modules) suitable for <script type="module"> tags
    format: outputESM ? 'esm' : 'iife',

    sourcemap: !production,

    inlineDynamicImports: true,
  },
  preserveEntrySignatures: false,
  // code-splitting is NOT allowed for single bundle
  manualChunks: outputESM
    ? {
        vendor: ['node_modules/highcharts/highcharts.js'],
      }
    : undefined,
  plugins: [
    resolve(), // find and resolve any Node commonjs module
    // babel({ babelHelpers: 'bundled', exclude: /node_modules/ }),
    commonjs(), // converts to ES modules
    production && terser(), // minify, but only in production,
  ],
};
