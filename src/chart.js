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
    plotBorderWidth: 1,

    // useful for tests
    // borderWidth: 2,

    // A4 page size - 595 pixels x 842 pixels in screen resolution
    width: 1000,
    height: 675,
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
    min: 0,
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
    // lineWidth: 1,
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
  return svg2blob.getFromSVG(getSVG(), { mimetype, quality, asDataUrl: true });
}

/**
 * Create/update the Highcharts chart for given data
 * @param {{name:string, points: [number, number}[]} listData
 * @param {{title: string, isJSDOM:boolean, isCaptionInSVG: boolean}} extraOpts
 */
export function update(
  listData,
  { title, isJSDOM = false, isCaptionInSVG = true } = {}
) {
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

  // TODO: ❓ make it dynamic doesn't need to be in one A4 page
  let heightChart = defOptions.chart.height;

  const heightLine = createCaptionSVG.heightLine;
  // for single chart the caption will be 2 lines (Max, Integral),
  // for many charts it will be (1 (table-header) + charts.length + 1 (average)) lines
  let heightCaption =
    heightLine * (charts.length === 1 ? 2 : charts.length + 2);
  const marginCaption = 100;

  const /* Highcharts.Options */ opts1 = merge.all([
      defOptions,
      {
        series: charts.map((chart) => chart.series),

        chart: {
          events: {
            // when the chart is loaded render the caption (with max/integral) as SVG
            load: function () {
              isCaptionInSVG &&
                createCaptionSVG(this, charts, heightChart - heightCaption);
            },
          },
          marginBottom: isCaptionInSVG
            ? heightCaption + marginCaption
            : undefined,
        },
        title: {
          text: title,
        },
        caption: {
          ...defOptions.caption,
          enabled: !isCaptionInSVG,
          text: !isCaptionInSVG ? createCaptionHtml(charts) : undefined,
        },
        // if single chart then no need to set a name as it's same as the title
        legend: {
          enabled: charts.length > 1,
        },
      },
    ]);

  currentChart = Highcharts.chart('myHighcharts', opts1);
}

/**
 *
 * @param {{series: {name: string}, max: number, integral: number}[]} charts
 */
function createCaptionHtml(charts) {
  //  NOTE: Don't use <hr> as it cannot be exported for some reason as proper SVG (so later PNG conversion fails)
  // for single chart -no need to render as table
  if (charts.length === 1)
    return `<div>Max Force: <b>${
      charts[0].max
    } kN</b> </div><div> Integral: <b>${round(
      charts[0].integral,
      2
    )} kJ</b></div>`;

  // NOTE: Cannot use global CSS style (like for instance some class) as it looks fine in browser
  // but when exporting the styles are missing - so used inline styles
  const style = `style="border: 1px solid darkgrey;border-collapse: collapse; padding: 5px"`;

  let sum = {
    max: 0,
    integral: 0,
  };
  const rows = charts.map(({ series: { name }, max, integral }) => {
    sum.max += max;
    sum.integral += integral;
    return `<tr><td ${style}>${name}</td><td ${style}>${max}</td><td ${style}>${integral}</td></tr>`;
  });
  const rowAverage = `<tr><td ${style}>Average</td><td ${style}>${round(
    sum.max / charts.length,
    2
  )}</td>
  <td ${style}>${round(sum.integral / charts.length, 2)}</td></tr>`;
  return `<table ${style}>
  <tr><th ${style}>Name</th><th ${style}>Max Force [kN]</th><th ${style}>Integral [kJ]</th></tr>
  ${rows.join('')}
  ${rowAverage}
  </table>`;
}

/**
 * Create the data table
 * @param {Highcharts.Chart} currentChart
 * @param {{series: {name:string}, max:number, integral: number}[]} charts
 * @param {number} top
 */
function createCaptionSVG({ renderer }, charts, top) {
  // user options
  const tableTop = top,
    colWidth = 150,
    tableLeft = 20,
    rowHeight = 20,
    cellPadding = 2.5;

  let cellLeft = tableLeft;

  const textCSS = { color: '#666666', fill: '#666666' };
  const textBoldCSS = { ...textCSS, fontWeight: 'bold' };

  if (charts.length === 1) {
    renderer
      .text(`Max Force: ${charts[0].max} kN`, cellLeft + cellPadding, tableTop)
      .css(textBoldCSS)
      .add();
    renderer
      .text(
        `Integral: ${round(charts[0].integral, 2)} kJ`,
        cellLeft + cellPadding,
        tableTop + rowHeight
      )
      .css(textBoldCSS)
      .add();
    return;
  }

  let sum = {
    max: 0,
    integral: 0,
  };

  // first column
  charts.forEach(({ series: { name } }, i) => {
    renderer
      .text(
        // cut the string as it must fit in 150px,
        // it depends on the concrete chars ("111" is not same width as "WWW")
        // but after trying 18 chars max is ok for max
        name.substr(0, 18),
        cellLeft + cellPadding,
        tableTop + (i + 1) * rowHeight - cellPadding
      )
      .css(textCSS)
      .add();
  });
  renderer
    .text(
      'Average',
      cellLeft + cellPadding,
      tableTop + (charts.length + 1) * rowHeight - cellPadding
    )
    .css(textBoldCSS)
    .add();

  // second column
  cellLeft += colWidth;
  renderer
    .text('Max Force [kN]', cellLeft + cellPadding, tableTop - cellPadding)
    .css(textBoldCSS)
    .add();
  charts.forEach(({ max }, i) => {
    sum.max += max;
    renderer
      .text(
        max,
        cellLeft + cellPadding,
        tableTop + (i + 1) * rowHeight - cellPadding
      )
      .css(textCSS)
      .add();
  });
  renderer
    .text(
      round(sum.max / charts.length, 2),
      cellLeft + cellPadding,
      tableTop + (charts.length + 1) * rowHeight - cellPadding
    )
    .css(textBoldCSS)
    .add();

  // third column
  cellLeft += colWidth;
  renderer
    .text('Integral [kJ]', cellLeft + cellPadding, tableTop - cellPadding)
    .css(textBoldCSS)
    .add();
  charts.forEach(({ integral }, i) => {
    sum.integral += integral;
    renderer
      .text(
        integral,
        cellLeft + cellPadding,
        tableTop + (i + 1) * rowHeight - cellPadding
      )
      .css(textCSS)
      .add();
  });
  renderer
    .text(
      round(sum.integral / charts.length, 2),
      cellLeft + cellPadding,
      tableTop + (charts.length + 1) * rowHeight - cellPadding
    )
    .css(textBoldCSS)
    .add();
}
createCaptionSVG.heightLine = 20;

// /**
//  * Draw a single line in the table
//  */
// function createTableLine(renderer, x1, y1, x2, y2) {
//   renderer
//     .path(['M', x1, y1, 'L', x2, y2])
//     .attr({
//       stroke: 'silver',
//       'stroke-width': 1,
//     })
//     .add();
// }

/**
 * Example:
 *    round(123,1313213123,1)  => 123,1
 *    round(123,1313213123,2)  => 123,13
 *    round(123,1313213123,3)  => 123,131
 * @param {number} num
 * @param {number} precision
 */
function round(num, precision = 2) {
  // round to 2nd point
  const del = 10 * precision;
  return Math.round((num + Number.EPSILON) * del) / del;
}
