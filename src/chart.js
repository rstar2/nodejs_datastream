import merge from 'deepmerge';
import Highcharts from 'highcharts';
// Load the exporting module.
import Exporting from 'highcharts/modules/exporting';

// Initialize exporting module.
Exporting(Highcharts);

Highcharts.AST.allowedTags.push('h1');

let currentChart = null;

/**
 * @type {Highcharts.Options}
 */
const defOptions = {
  title: {
    text: 'Trace',
  },
  subtitle: {
    text: 'According to the Standard Atmosphere Model',
  },
  credits: {
    // this is by default in right-bottom corner
    text: '<b>Electric Turbo</b>',
  },
  caption: {
    // add custom text below
    useHTML: true,
    text: '<hr> Max: <b>%max%</b> <br> Integral: <b>%integral%</b>',
    align: 'left',
    x: 50,
    y: 20,
  },
  legend: {
    // don't show the legend text
    enabled: false,
  },
  chart: {
    width: 1000,
    height: 500,
    type: 'line',
    zoomType: 'x',
    // scrollablePlotArea: {
    //   minWidth: 100,
    //   scrollPositionX: 1,
    // },
  },
  xAxis: {
    scrollbar: {
      enabled: true,
    },
    // tickLength: 0,
  },
  //   yAxis: {},
};

/**
 * Create/update the Highcharts chart for given data
 * @param  {[number, number][]} points
 * @param  {Object} extraOpts
 */
export function update(points, extraOpts = {}) {
  // destroy any previous chart (to avoid memory leaks)
  if (currentChart) currentChart.destroy();

  const chart = {
    data: points,
    marker: {
      radius: 2,
    },
  };

  let max = 0;
  // TODO: Implement this "integral"
  let integral = 0;
  points.forEach((point) => {
    // search the max
    if (point[1] > max) max = point[1];
    integral += point[0];
  });

  const /* Highcharts.Options */ opts = merge.all([
      defOptions,
      extraOpts,
      {
        series: [chart],
        caption: {
          ...defOptions.caption,
          text: defOptions.caption.text
            .replace('%max%', max)
            .replace('%integral%', integral),
        },
      },
    ]);
  currentChart = Highcharts.chart('myHighcharts', opts);

  // export to window, so that they could be used from external scripts, or like it is done now form jsdom (it don't support ES modules)
  window.highchartsChart = currentChart;
}

// export to window, so that they could be used from external scripts, or like it is done now form jsdom (it don't support ES modules)
window.Highcharts = Highcharts;
