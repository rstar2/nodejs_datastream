const fs = require('fs');
const path = require('path');

// const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');

const { title, files, format, fileOut } = require('../lib/args');
const { convertFile } = require('../lib/convert');
const { FORMAT_TYPE, getLastName } = require('../lib/util');

const jsdom = require('jsdom');

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

  await exportChart(listData, { title });
}

async function setupJsdom(fileHtml) {
  // class CustomResourceLoader extends jsdom.ResourceLoader {
  //   fetch(url, options) {
  //     if (options.element) {
  //       console.log(
  //         `Element ${options.element.localName} is requesting the url ${url}`
  //       );
  //     }
  //     return super.fetch(url, options);
  //   }
  // }
  // const resourceLoader = new CustomResourceLoader();

  // redirect the window's console (e.g. "browsers" console), to the Node's console
  const virtualConsole = new jsdom.VirtualConsole();
  virtualConsole.sendTo(console);

  // NOTE: cannot use the easier jsdom.JSDOM.fromFile() API
  // as it internally uses the "promise" based "fs module (e.g.  const fs = require("fs").promises)
  // BUT pkg cannot work with it - there's a bug https://github.com/vercel/pkg/issues/958
  //   const dom = await jsdom.JSDOM.fromFile(fileHtml, {
  //     runScripts: 'dangerously',
  //     resources: 'usable',
  //     //   resources: resourceLoader,
  //     virtualConsole,
  //   });

  const dom = new jsdom.JSDOM(fs.readFileSync(fileHtml), {
    url: new URL('file:' + path.resolve(fileHtml)),
    runScripts: 'dangerously',
    resources: 'usable',
    //   resources: resourceLoader,
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
    convertFile(
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
  const svg = window.chart.getSVG();

  switch (format) {
    case FORMAT_TYPE.SVG:
      fs.writeFileSync(fileOut, svg);
      break;
    case FORMAT_TYPE.PDF: {
      // TODO: convert to PDF
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(fileOut);
      SVGtoPDF(doc, svg, 0, 0);
      doc.pipe(stream);
      doc.end();
      break;
    }
    default:
    // TODO: convert to PNG/JPG
    //   const buffer = Buffer.from(svg, 'utf8');
    //   let sharping = sharp(buffer);
    //   if (format === FORMAT_TYPE.PNG) sharping = sharping.png();
    //   else if (format === FORMAT_TYPE.JPEG) sharping = sharping.jpeg();
    //   else throw new Error(`Unsupported output format ${format}`);
    //   await sharping.toFile(fileOut);
  }

  console.log(`Saved chart to ${fileOut} in '${format.toUpperCase()}' format`);
}

// start the script
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
