const fs = require('fs');
const path = require('path');

const { getFileIn } = require('../lib/args');
const { convertFile } = require('../lib/convert');

const fileIn = getFileIn();

const jsdom = require('jsdom');

let window;

async function main() {
  await setupJsdom(path.resolve(__dirname, '../public/index.html'));

  await new Promise((resolve) => (window.onload = resolve));

  setupHighcharts();

  const chartData = await getChartData(fileIn);
  exportChart(chartData, fileIn + '.svg');
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

  const dom = await jsdom.JSDOM.fromFile(fileHtml, {
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
  window.Highcharts.setOptions({
    plotOptions: {
      series: {
        animation: false,
        dataLabels: {
          defer: false,
        },
      },
    },
  });
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

function exportChart(chartData, fileOut) {
  // 1. draw the chart
  window.chart.update([chartData]);
  // console.log(window.innerWidth, window.innerHeight);

  // 2. export it
  const svg = window.highchartsChart.getSVG();
  //   const svg = window.highchartsChart.sanitizeSVG();

  fs.writeFileSync(fileOut, svg);
}

// start the script
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

// const { implSymbol } = require('jsdom/lib/jsdom/living/generated/utils.js');
// download(window, 'test.out', 'Hello');
// function download(window, filename, text) {
//   const data = {
//     name: 'Rumen',
//     country: 'BG',
//     role: 'Web Developer',
//   };
//   // Creating a blob object from non-blob data using the Blob constructor
//   //
//   const blob = new window.Blob([text], {
//     type: 'text/plain',
//   });

//   console.log(blob[implSymbol]._buffer);
// }
