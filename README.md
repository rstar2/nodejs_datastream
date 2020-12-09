# Datastream chart creation

## Getting started

Clone this repository and install its dependencies:

```bash
git clone https://github.com/rollup/rollup-starter-app
cd rollup-starter-app
npm install

# or
npx degit "rollup/rollup-starter-app" my-app
cd my-app
npm install
```

The `public/index.html` file contains a `<script src='main.js'>` tag, which means we need to create `public/main.js`. The `rollup.config.js` file tells Rollup how to create this bundle, starting with `src/main.js` and including all its dependencies, .

`npm run build` builds the application to `public/main.js`, along with a sourcemap file for debugging.

`npm start` launches a server, using [serve](https://github.com/zeit/serve). Navigate to [localhost:3000](http://localhost:3000).

`npm run watch` will continually rebuild the application as your source files change.

`npm run dev` will run `npm start` and `npm run watch` in parallel.

## License

[MIT](LICENSE).

---

## TODO

1. Add strategy for filtering the "initial" and "back" points (strategy or middleware pattern, or even using RxJS)
1. ~~Use highcharts NPM module~~
1. ~~Split Rollup bundles to vendor and app/local~~
    > Technically  not possible until JSDOM supports ES modules
