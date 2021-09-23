const fs = require('fs');
const path = require('path');

const jsdom = require('jsdom');

// const sharp = require('sharp');
// const PDFDocument = require('pdfkit');
// const SVGtoPDF = require('svg-to-pdfkit');

const { getLastName, MODE_CHART } = require('../lib/util');
const { title, credits, files, format, mode, fileOut } = require('../lib/args');
const { parseFile } = require('../lib/parse-fs');

let window;

async function main() {
  // NOTE: For pkg auto-detecting-assets path.join() MUST be used, not path.resolve()
  await setupJsdom(path.join(__dirname, '../public/index.html'));

  await new Promise((resolve) => (window.onload = resolve));

  setupHighcharts();

  let listData = await Promise.allSettled(
    files.map(async (file) => {
      return {
        points: await getChartData(file),
        name: getLastName(file),
      };
    })
  );
  listData = listData
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  // the logo height must be specified also, otherwise some normal image viewer apps
  // will not be able to show it while the browsers don't have problem
  const logoDataUrl = await fs.readFileSync(
    path.join(__dirname, '../public/img/etem-gestamp-logo-dataurl.txt'),
    { encoding: 'utf8' }
  );

  await exportChart(listData, {
    isJSDOM: true,
    title,
    credits,
    logo: { dataUrl: logoDataUrl, width: 250, height: 57.5 },
    isCaptionInSVG: true,
    isWithDisplacement: mode === MODE_CHART.THREE_POINT_BENDING,
  });
}

async function setupJsdom(fileHtml) {
  // redirect the window's console (e.g. "browsers" console), to the Node's console
  const virtualConsole = new jsdom.VirtualConsole();
  virtualConsole.sendTo(console);

  const dom = await jsdom.JSDOM.fromFile(fileHtml, {
    runScripts: 'dangerously',
    resources: 'usable',
    virtualConsole,
  });

  // store this global window - will be used form now on
  window = dom.window;

  window.Date = Date;

  const document = window.document;

  // Do some modifications to the jsdom document in order to get the SVG bounding
  // boxes right.
  const oldCreateElementNS = document.createElementNS;
  document.createElementNS = (ns, tagName) => {
    let elem = oldCreateElementNS.call(document, ns, tagName);
    if (ns !== 'http://www.w3.org/2000/svg') {
      return elem;
    }

    /**
     * Pass Highcharts' test for SVG capabilities
     * @returns {undefined}
     */
    elem.createSVGRect = () => {};
    /**
     * jsdom doesn't compute layout (see
     * https://github.com/tmpvar/jsdom/issues/135). This getBBox implementation
     * provides just enough information to get Highcharts to render text boxes
     * correctly, and is not intended to work like a general getBBox
     * implementation. The height of the boxes are computed from the sum of
     * tspans and their font sizes. The width is based on an average width for
     * each glyph. It could easily be improved to take font-weight into account.
     * For a more exact result we could to create a map over glyph widths for
     * several fonts and sizes, but it may not be necessary for the purpose.
     * @returns {Object} The bounding box
     */
    elem.getBBox = () => {
      let lineWidth = 0,
        width = 0,
        height = 0;

      let children = [].slice.call(
        elem.children.length ? elem.children : [elem]
      );

      children
        .filter((child) => {
          if (child.getAttribute('class') === 'highcharts-text-outline') {
            child.parentNode.removeChild(child);
            return false;
          }
          return true;
        })
        .forEach((child) => {
          let fontSize = child.style.fontSize || elem.style.fontSize,
            lineHeight,
            textLength;

          // The font size and lineHeight is based on empirical values,
          // copied from the SVGRenderer.fontMetrics function in
          // Highcharts.
          if (/px/.test(fontSize)) {
            fontSize = parseInt(fontSize, 10);
          } else {
            fontSize = /em/.test(fontSize) ? parseFloat(fontSize) * 12 : 12;
          }
          lineHeight =
            fontSize < 24 ? fontSize + 3 : Math.round(fontSize * 1.2);
          textLength = child.textContent.length * fontSize * 0.55;

          // Tspans on the same line
          if (child.getAttribute('dx') !== '0') {
            height += lineHeight;
          }

          // New line
          if (child.getAttribute('dy') !== null) {
            lineWidth = 0;
          }

          lineWidth += textLength;
          width = Math.max(width, lineWidth);
        });

      return {
        x: 0,
        y: 0,
        width: width,
        height: height,
      };
    };
    return elem;
  };

  return dom;
}

function setupHighcharts() {
  // Disable all animation
  window.chart.disableAnimation();
}

async function getChartData(fileIn) {
  return new Promise((resolve, reject) => {
    const chartData = [];
    parseFile(
      fileIn,
      function onLine(lineData) {
        // console.log(lineData);
        chartData.push(lineData);
      },
      function onFinish(error) {
        if (error) {
          return reject(error);
        }

        resolve(chartData);
      }
    );
  });
}

async function exportChart(chartData, opts) {
  // 1. draw the chart
  window.chart.update(chartData, opts);
  // console.log(window.innerWidth, window.innerHeight);

  // 2. export it from highcharts and save it to disk
  await convertAndSave();
}

async function convertAndSave() {
  // 🏳🏳 Latest requirements are so that only SVG is needed
  //   switch (format) {
  //     case FORMAT_TYPE.SVG: {
  //       const svg = window.chart.getSVG();
  //       fs.writeFileSync(fileOut, svg);
  //       break;
  //     }
  //     case FORMAT_TYPE.PDF: {
  //       const svg = window.chart.getSVG();
  //       const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  //       const stream = fs.createWriteStream(fileOut);
  //       SVGtoPDF(doc, svg, 0, 0);
  //       doc.pipe(stream);
  //       doc.end();
  //       break;
  //     }
  //     default: {
  //       const imageDataUrl = await window.chart.getImageDataUrl(
  //         `image/${format === FORMAT_TYPE.PNG ? 'png' : 'jpg'}`
  //       );
  //       // example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAo...';
  //       const imageData = imageDataUrl.split(',')[1];
  //       const image = Buffer.from(imageData, 'base64');
  //       fs.writeFileSync(fileOut, image);

  //       //   // convert to PNG/JPG using 'sharp'
  //       //   const buffer = Buffer.from(svg, 'utf8');
  //       //   let sharping = sharp(buffer);
  //       //   if (format === FORMAT_TYPE.PNG) sharping = sharping.png();
  //       //   else if (format === FORMAT_TYPE.JPEG) sharping = sharping.jpeg();
  //       //   else throw new Error(`Unsupported output format ${format}`);
  //       //   await sharping.toFile(fileOut);
  //     }
  //   }

  const svg = window.chart.getSVG();
  fs.writeFileSync(fileOut, svg);

  console.log(`Saved chart to ${fileOut} in '${format.toUpperCase()}' format`);
}

// start the script
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
