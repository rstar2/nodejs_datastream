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

First build latest production version of the client code and then package it with 'pkg'.
This is done with:

```bash
npm run pkg;
```

🚩️ Note: Any used static files from public folder must be specified in pkg.json "assets"
This is also true for any dynamically required scripts or binaries

See also https://github.com/vercel/pkg/issues/107

🚩️ Note: to examine the generated by **pkg** inside the executable snapshot use:
­

```bash
pkg --debug app.js -o output > dist/debug.log
DEBUG_PKG=1 output > dist/run.log
```

So all is in run.log (and debug.log)

## Deploying the web version

The web app is hosted by Surge.sh on the data-chart.surge.sh domain.

First ensure the surge CLI is installed with ```npm install -g surge``` and then "login" into Surge.sh with ```surge login```.

Run ```npm run deploy``` in order to upload the public folder to Surge.sh.

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

List local tags ```git tag --list```

Delete local tag:  ```git tag -d v1.0.0```

List remote tags ```git ls-remote --tags origin```

Delete remote tag: ```git push --delete origin tag v1.0.0```

It's good before that ot update the CHANGES.md file.

## License

[MIT](LICENSE).

---

## TODO

1. ~~CLI - Create arguments parsing (format, ...). Add help message~~
1. ~~Support multiple datastream files~~ - NOT NEEDED for now
1. ~~Convert output SVG to PNG or JPEG format~~
1. ~~Use highcharts NPM module~~
1. ~~Split Rollup bundles to vendor and app/local~~
    > Technically not possible until JSDOM supports loading of ES modules (e.g. ```<script type="module">```)
1. ~~Use a GitHub-Action for running "npm run pkg" and creating a new "release"~~
    > Created .github/workflows/release/yml.
    It is started when a new Tag with pattern "vXXX" is created, e.g on new Tag 'v1.0.0' a new Release 'chart-v1.0.0.zip' will be created
1. ~~Error cases~~
    1. ~~CLI misusage~~
    1. ~~Invalid datastream file structure~~
    1. ~~Charting failure (inside jsdom/highcharts/image-conversion)~~
1. ~~Add "legend"/meta-data info below the chart~~
    1. ~~Max point~~
    1. ~~Integral~~
    1. ? Split the max 9 files into 3 table with 3 rows each ?
    1. ~~Fix when usage with JSDOM as then exported SVG is not with correct "heights" as when in the browser, and so this legend is "invisible"~~
        > Problem is not JSDOM but the \<foreignObject\> element inside the \<svg>, and the caption (with the max/integral values) is such.
        Even a "correct" SVG image exported from the browser is not properly rendered in a image-viewer application as it will also not recognize the \<foreignObject\> and skip it.
        So don't render the caption as HTML but render it inside as SVG.
        See https://www.highcharts.com/forum/viewtopic.php?t=39093 and example in
        http://jsfiddle.net/highcharts/z9zXM/

1. ~~Test cases with Jest~~
1. ~~Then add CI (GitHub-Action) that runs the test after each commit-push~~
    > Created .github/workflows/test.yml GitHub-Action

1. ~~Make the Release GitHubAction produce an executable for both Linux and Windows~~
    > Not needed for now as no binaries will be packaged in the executable (no need for server conversion for now, SVG is enough)

## Notes

🏳 Could not managed to bundle the 'sharp' module with pkg inside a single executable, so will use the 'canvas' module

How it works:
The node wrapper opens the uses 'jsdom' to simulate a DOM/browser environment.
There it loads the webapp (Highcharts and etc..).
The Highcharts in client can only export a SVG image string.

So the nodejs wrapper will:

- For SVG - just save the SVG received from client
- For PDF - convert the SVG to PDF using 'pdfkit' and 'svg-to-pdfkit'
- For PNG/JPG - best is to use 'sharp' but could't managed to bundle with pkg in a single executable
   So implemented it as the client is reporting the PNG/JPG as image DataUrl, which in browser is supported natively but in order to work in nodejs with 'jsdom' the 'canvas' module has to be imported. The downside is that when bundled in the executable it adds around 80MB-windows (180-linux) more.

🏳 For PDF conversion in the client - if needed real PDF (can use 'jsPDF' and 'svg2pdf.js') otherwise it can be implemented as just inserted image inside but there's no point in that - so this feature is not implemented. Actually Highcharts can converted with their exporting server.

🏳🏳 Latest requirements are so that only SVG is needed (no other conversion in server side), so remove 'canvas', 'pdfkit' and 'svg-to-pdfkit' modules.
