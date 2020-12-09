import merge from 'deepmerge';
import Highcharts from 'highcharts';
// Load the exporting module.
import Exporting from 'highcharts/modules/exporting';

// Initialize exporting module.
Exporting(Highcharts);

let currentChart = null;

const defOptions = {
  title: {
    text: 'Trace',
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
 * @param  {[[number, number]][]} traces
 * @param  {Object} extraOpts
 */
export function update(traces, extraOpts = {}) {
  // destroy any previous chart (to avoid memory leaks)
  if (currentChart) currentChart.destroy();

  const series = traces.map((trace) => {
    return {
      data: trace,
      marker: {
        radius: 2,
      },
    };
  });

  const opts = merge.all([
    defOptions,
    extraOpts,
    {
      series,
    },
  ]);
  currentChart = Highcharts.chart('myHighcharts', opts);

  // export to window, so that they could be used from external scripts, or like it is done now form jsdom (it don't support ES modules)
  window.highchartsChart = currentChart;
}

// export to window, so that they could be used from external scripts, or like it is done now form jsdom (it don't support ES modules)
window.Highcharts = Highcharts;
