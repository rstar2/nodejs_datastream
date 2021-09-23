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
  colors: [
    '#058DC7',
    '#50B432',
    '#ED561B',
    '#DDDF00',
    '#24CBE5',
    '#64E572',
    '#FF9655',
    '#FFF263',
    '#6AF9C4',
  ],
  title: {
    text: '%title%', // this is dynamic value set later
  },
  //   subtitle: {
  //     text: 'Subtitle',
  //   },
  credits: {
    // this is by default in right-bottom corner
    text: '<b>%credits%</b>', // this is dynamic value set later
    style: {
      color: '#999999',
      cursor: 'pointer',
      fontSize: '12px',
    },
    position: {
      y: -20,
    },
  },
  caption: {
    // add custom text below
    useHTML: true,
    text: '%caption%', // this is dynamic value set later
    align: 'left',
    x: 50,
    y: 20,
  },
  legend: {
    align: 'left',
    verticalAlign: 'top',
    borderWidth: 0,
    x: 60,
    enabled: false,
  },
  plotOptions: {
    series: {
      // if needed to not show the legend text - for 'series' type legend.enable=false is not enough
      showInLegend: false,
    },
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
      text: 'Displacement [mm]',
      margin: 10,
    },
    labels: {
      format: '{value}',
    },
    min: 0,
    // tickLength: 0,
  },

  yAxis: {
    title: {
      enabled: true,
      text: 'Force [kN]',
    },
    labels: {
      // format: '{value} kN',
      formatter() {
        return `${this.value}`;
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
 * @param {{title: string, credits: string,
 * logo?: {dataUrl: string, width: number, height?: number}, isJSDOM:boolean,
 * isCaptionInSVG: boolean, isWithDisplacement: boolean}} extraOpts
 */
export function update(
  listData,
  {
    title,
    credits,
    isJSDOM = false,
    logo = undefined,
    isCaptionInSVG = true,
    isWithDisplacement = false,
  } = {}
) {
  // destroy any previous chart (to avoid memory leaks)
  if (currentChart) currentChart.destroy();

  const charts = listData.map(({ points, name }) => {
    let maxD = 0;
    let maxF = 0;
    // Implement this "integral"
    let integral = 0;
    // points = points.splice(points.length - 20);
    points.forEach((point, index) => {
      // search the max
      const x = point[0];
      const y = point[1];
      if (x > maxD) maxD = x;
      if (y > maxF) maxF = y;

      if (index > 0) {
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
      maxD,
      maxF,
      integral: integral / 1000,
    };
  });

  // TODO: ❓ make it dynamic if doesn't need to be in one A4 page
  const widthChart = defOptions.chart.width;
  const heightChart = defOptions.chart.height;
  const heightCaption = createCaptionSVG.calcHeight(charts.length);
  const marginCaption = 100;

  const /* Highcharts.Options */ opts1 = merge.all([
      defOptions,
      {
        series: charts.map((chart) => chart.series),

        chart: {
          events: {
            // when the chart is loaded render the caption (with max/integral) as SVG
            load: function () {
              // render the caption (in this case the table with series names)
              isCaptionInSVG &&
                createCaptionSVG(
                  this,
                  charts,
                  heightChart - heightCaption,
                  isWithDisplacement
                );

              // render log in place of the credits
              logo &&
                createLogo(this, logo, heightChart - heightCaption, widthChart);
            },
          },
          marginBottom: isCaptionInSVG
            ? heightCaption + marginCaption
            : undefined,
        },
        title: {
          text: defOptions.title.text.replace('%title%', title),
        },
        credits: {
          enabled: !logo,
          text: defOptions.credits.text.replace('%credits%', credits),
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
    return `<div>Fmax: <b>${round(
      charts[0].max,
      3
    )} kN</b> </div><div>Ea: <b>${round(charts[0].integral, 2)} kJ</b></div>`;

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
    return `<tr><td ${style}>${name}</td><td ${style}>${round(
      max,
      3
    )}</td><td ${style}>${round(integral)}</td></tr>`;
  });
  const rowAverage = `<tr><td ${style}>Average</td><td ${style}>${round(
    sum.max / charts.length,
    2
  )}</td>
  <td ${style}>${round(sum.integral / charts.length, 2)}</td></tr>`;
  return `<table ${style}>
  <tr><th ${style}>Name</th><th ${style}>Fmax [kN]</th><th ${style}>Ea [kJ]</th></tr>
  ${rows.join('')}
  ${rowAverage}
  </table>`;
}

/**
 * Create the caption table
 * @param {Highcharts.Chart} currentChart
 * @param {{series: {name:string}, maxF:number, maxD:number, integral: number}[]} charts
 * @param {number} top
 * @param {boolean} withColumnDisplacement
 */
function createCaptionSVG(
  { renderer, options },
  charts,
  top,
  withColumnDisplacement = false
) {
  // find the name with max chars
  let maxName = 0;
  charts.forEach(
    ({ series: { name } }) => (maxName = Math.max(name.length, maxName))
  );
  maxName = Math.min(maxName, createCaptionSVG.maxName);

  // table options
  const tableTop = top,
    colWidthName = maxName * createCaptionSVG.charWidth,
    colWidthFMax = 100,
    colWidthEa = 100,
    tableLeft = 20,
    rowHeight = createCaptionSVG.heightLine,
    cellPadding = 2.5;

  let cellLeft = tableLeft;

  // these must be always cloned as they get merged in some cases
  const textCSS = { color: '#666666', fill: '#666666' };
  const textBoldCSS = { ...textCSS, fontWeight: 'bold' };

  let sum = {
    maxF: 0,
    maxD: 0,
    integral: 0,
  };

  // first column
  charts.forEach(({ series: { name } }, i) => {
    renderer
      .text(
        // cut the string as it must fit in 150px,
        // it depends on the concrete chars ("111" is not same width as "WWW")
        // but after trying 18 chars max is ok for max
        name.substr(0, createCaptionSVG.maxName),
        cellLeft + cellPadding,
        tableTop + (i + 1) * rowHeight - cellPadding
      )
      .css({ ...textCSS, color: options.colors[i] })
      .add();
  });
  if (charts.length > 1) {
    renderer
      .text(
        'Average',
        cellLeft + cellPadding,
        tableTop + (charts.length + 1) * rowHeight - cellPadding
      )
      .css(textBoldCSS)
      .add();
  }

  // second column
  cellLeft += colWidthName;
  renderer
    .text('Fmax [kN]', cellLeft + cellPadding, tableTop - cellPadding)
    .css(textBoldCSS)
    .add();
  charts.forEach(({ maxF }, i) => {
    sum.maxF += maxF;
    renderer
      .text(
        round(maxF, 3),
        cellLeft + cellPadding,
        tableTop + (i + 1) * rowHeight - cellPadding
      )
      .css(textCSS)
      //   .css({ ...textCSS, color: options.colors[i] })
      .add();
  });
  if (charts.length > 1) {
    renderer
      .text(
        round(sum.maxF / charts.length, 3),
        cellLeft + cellPadding,
        tableTop + (charts.length + 1) * rowHeight - cellPadding
      )
      .css(textBoldCSS)
      .add();
  }

  // third column
  cellLeft += colWidthFMax;
  renderer
    .text('Ea [kJ]', cellLeft + cellPadding, tableTop - cellPadding)
    .css(textBoldCSS)
    .add();
  charts.forEach(({ integral }, i) => {
    sum.integral += integral;
    renderer
      .text(
        round(integral),
        cellLeft + cellPadding,
        tableTop + (i + 1) * rowHeight - cellPadding
      )
      .css(textCSS)
      //   .css({ ...textCSS, color: options.colors[i] })
      .add();
  });
  if (charts.length > 1) {
    renderer
      .text(
        round(sum.integral / charts.length),
        cellLeft + cellPadding,
        tableTop + (charts.length + 1) * rowHeight - cellPadding
      )
      .css(textBoldCSS)
      .add();
  }

  if (withColumnDisplacement) {
    // fourth column
    cellLeft += colWidthEa;
    renderer
      .text('Dmax [mm]', cellLeft + cellPadding, tableTop - cellPadding)
      .css(textBoldCSS)
      .add();
    charts.forEach(({ maxD }, i) => {
      sum.maxD += maxD;
      renderer
        .text(
          round(maxD, 3),
          cellLeft + cellPadding,
          tableTop + (i + 1) * rowHeight - cellPadding
        )
        .css(textCSS)
        //   .css({ ...textCSS, color: options.colors[i] })
        .add();
    });
    if (charts.length > 1) {
      renderer
        .text(
          round(sum.maxD / charts.length, 3),
          cellLeft + cellPadding,
          tableTop + (charts.length + 1) * rowHeight - cellPadding
        )
        .css(textBoldCSS)
        .add();
    }
  }
}
createCaptionSVG.maxName = 50 + 4; // 4 is for the extension
createCaptionSVG.charWidth = 9; // by testing, 10 is safer but 
createCaptionSVG.heightLine = 20;
/**
 * Calculate the height of the caption
 * @param {number} charts
 * @returns
 */
createCaptionSVG.calcHeight = (charts) => {
  // for single chart the caption will be with 1 extra line line (table-header)
  // for multiple charts it will be with 2 extra lines (table-header + average)
  return createCaptionSVG.heightLine * (charts + (charts === 1 ? 1 : 2));
};

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
 * Create the logo
 * @param {Highcharts.Chart} currentChart
 * @param {{dataUrl: string, width: number, height?: number}} logo
 * @param {number} top
 * @param {number} chartWidth
 */
function createLogo({ renderer }, logo, top, chartWidth) {
  const svgEl = renderer
    .image(
      logo.dataUrl,
      chartWidth - logo.width,
      top - 20,
      logo.width,
      logo.height || 0
    )
    .add();

  // the height has to be removed from the internal SVG/HTML element so it can be relative to the width
  if (!logo.height) svgEl.element.removeAttribute('height');
}

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
  const del = Math.pow(10, precision);
  return Math.round((num + Number.EPSILON) * del) / del;
}
