import merge from 'deepmerge';
import * as svg2blob from './svg2blob';

import Highcharts from 'highcharts';

// Load the exporting module.
import Exporting from 'highcharts/modules/exporting';

// import 'jspdf';
// import 'svg2pdf.js';
// import OfflineExporting from 'highcharts/modules/offline-exporting';

// Initialize exporting module.
Exporting(Highcharts);
// OfflineExporting(Highcharts);

// Highcharts.AST.allowedTags.push('h1,div,table,th,tr,td');

/**
 * @type {Highcharts.Chart|undefined}
 */
let currentChart = null;

/**
 * @type {Highcharts.Options}
 */
const defOptions = {
  exporting: {
    allowHTML: true,
    fallbackToExportServer: false,
  },
  title: {
    text: 'Title', // this is dynamic value set later
  },
  //   subtitle: {
  //     text: 'Subtitle',
  //   },
  credits: {
    // this is by default in right-bottom corner
    text: '<b>Electric Turbo</b>',
    position: {
      y: -20,
    },
  },
  caption: {
    // add custom text below
    useHTML: true,
    text: 'Caption', // this is dynamic value set later
    align: 'left',
    x: 50,
    y: 20,
  },
  legend: {
    align: 'left',
    verticalAlign: 'top',
    borderWidth: 0,
    x: 60,

    // if needed to not show the legend text
    // enabled: false,
  },
  chart: {
    // A5 page size - 595 pixels x 842 pixels in screen resolution
    // TODO: Get dimensions of a normal A4 page format
    width: 1000,
    // TODO: this is problematic - should be dynamic, and it will hide the caption
    height: 675,
    // type: 'line',
    // zoomType: 'x',
    // scrollablePlotArea: {
    //   minWidth: 100,
    //   scrollPositionX: 1,
    // },
  },
  xAxis: {
    title: {
      enabled: true,
      text: 'Displacement',
      margin: 10,
    },
    labels: {
      format: '{value} mm',
    },
    scrollbar: {
      enabled: true,
    },
    // tickLength: 0,
  },

  yAxis: {
    title: {
      enabled: true,
      text: 'Force',
    },
    labels: {
      // format: '{value} kN',
      formatter() {
        if (this.value < 1000) return `${this.value} N`;

        return `${this.value / 1000} kN`;
      },
    },
    lineWidth: 1,
  },
};

export function disableAnimation() {
  Highcharts.setOptions({
    chart: {
      animation: false,
    },
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

/**
 * @return {string}
 */
export function getSVG() {
  if (!currentChart) throw new Error('No valid Highcharts chart');

  return currentChart.getSVG();
}

/**
 * @param {string} mimetype 
 * @param {string} quality 
 * @return {string}
 */
export async function getImageDataUrl(mimetype = 'image/png', quality = 1) {
    return svg2blob.getFromSVG(getSVG(), {mimetype, quality, asDataUrl: true});
}

/**
 * @return {SVGElement}
 */
export function getSVGElement() {
    if (!currentChart) throw new Error('No valid Highcharts chart');

    return currentChart.renderer.boxWrapper.element;
}

/**
 * Create/update the Highcharts chart for given data
 * @param {{name:string, points: [number, number}[]} listData
 * @param {Object} extraOpts
 */
export function update(listData, { title } = {}) {
  // destroy any previous chart (to avoid memory leaks)
  if (currentChart) currentChart.destroy();

  const charts = listData.map(({ points, name }) => {
    let max = 0;
    // Implement this "integral"
    let integral = 0;
    // points = points.splice(points.length - 20);
    points.forEach((point, index) => {
      // search the max
      const y = point[1];
      if (y > max) max = y;

      if (index > 0) {
        const x = point[0];
        const oldX = points[index - 1][0];
        const oldY = points[index - 1][1];

        integral += ((x - oldX) * (y + oldY)) / 2;
      }
    });

    // round to 2nd point
    integral = Math.round((integral / 1000 + Number.EPSILON) * 100) / 100;

    return {
      // this will be passed to Highcharts
      series: {
        name,
        data: points,
        marker: {
          radius: 2,
        },
      },

      // these are needed for the caption text
      max,
      integral,
    };
  });

  const /* Highcharts.Options */ opts = merge.all([
      defOptions,
      {
        series: charts.map((chart) => chart.series),

        title: {
          text: title,
        },
        caption: {
          ...defOptions.caption,
          text: createCaptionHtml(charts),
        },
        // if single chart then no need to set a name as it's same as the title
        legend: {
          enabled: charts.length > 1,
        },
      },
    ]);
  currentChart = Highcharts.chart('myHighcharts', opts);
}

/**
 *
 * @param {{name: string, max: number, integral: number}[]} charts
 */
function createCaptionHtml(charts) {
  //  NOTE: Don't use <hr> as it cannot be exported for some reason as proper SVG (so later PNG conversion fails)
  // for single chart -no need to render as table
  if (charts.length === 1)
    return `<div>Max: <b>${charts[0].max} mm</b> </div><div> Integral: <b>${charts[0].integral} kJ</b></div>`;

  // NOTE: Cannot use global CSS style (like for instance some class) as it looks fine in browser
  // but when exporting the styles are missing - so used inline styles
  const style = `style="border: 1px solid darkgrey;border-collapse: collapse; padding: 5px"`;

  const rows = charts.map(
    ({ series: { name }, max, integral }) =>
      `<tr><td ${style}>${name}</td><td ${style}>${max} mm</td><td ${style}>${integral} kJ</td></tr>`
  );
  return `<table ${style}>
  <tr><th ${style}>Name</th><th ${style}>Max</th><th ${style}>Integral</th></tr>
  ${rows.join('')}
  </table>`;
}
