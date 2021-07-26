# Datastream chart creation

## Getting started

Clone this repository and install its dependencies:

```bash
git clone https://.... folder
cd folder
npm install
```

## Run the app locally

The `public/index.html` file contains a `<script src='main.js'>` tag, which means we need to create `public/main.js`. The `rollup.config.js` file tells Rollup how to create this bundle, starting with `src/main.js` and including all its dependencies, .

`npm run build` builds the application to `public/main.js`, along with a sourcemap file for debugging.

`npm start` launches a server, using [serve](https://github.com/zeit/serve). Navigate to [localhost:3000](http://localhost:3000).

`npm run watch` will continually rebuild the application as your source files change.

`npm run dev` will run `npm start` and `npm run watch` in parallel.

## Building/Creating executables for both Linux and Windows with 'pkg'

First build latest production version of the client code and then package it with 'pkg'

```bash
npm run build
npm run pkg
```

## Creating a new release on GitHub - it's done with GitHub Actions

1. After all needed changes are committed and pushed
1. Create a new Tag starting with 'v', e.g. 'v1.0.0'
1. Push it to remote
1. This will trigger the workflow action 'release.yml' and build the executables and post them in the release

push all tags

```bash
git tag -a v1.0.0 -m "For a new release"
git push --tags
```

or to push just the single tag "v1.0.0"

```bash
git tag v1.0.0
git push origin tag v1.0.0 
```

Notes if needed t delete a tag:

Delete local tag:  ```git tag -d v1.0.0```

Delete remove tag: ```git push origin tag --delete v1.0.0```

## License

[MIT](LICENSE).

---

## TODO

1. ~~CLI - Create arguments parsing (format, strategy, ...). Add help message~~
1. ~~Support multiple datastream files~~ - NOT NEEDED for now
1. ~~Convert output SVG to PNG or JPEG format~~
1. ~~Add filter strategies:  skip the "initial" and later "backwards" points (strategy or middleware pattern, or even using RxJS)~~ - NOT NEEDED for now
1. ~~Use highcharts NPM module~~
1. ~~Split Rollup bundles to vendor and app/local~~
    > Technically not possible until JSDOM supports loading of ES modules (e.g. ```<script type="module">```)
1. ~~Use a GitHub-Action for running "npm run pkg" and creating a new "release"~~
    > Created .github/workflows/release/yml.
    It is started when a new Tag with pattern "vXXX" is created, e.g on new Tag 'v1.0.0' a new Release 'chart-v1.0.0.zip' will be created
1. Error cases
    1. ~~CLI misusage~~
    1. ~~Invalid datastream file structure~~
    1. Charting failure (inside jsdom/highcharts/image-conversion)
1. ~~Add "legend"/meta-data info below the chart~~
    1. ~~Max point~~
    1. Integral sum

1. ~~Test cases with Jest~~
1. ~~Then add CI (GitHub-Action) that runs the test after each commit-push~~
    > Created .github/workflows/test.yml GitHub-Action
