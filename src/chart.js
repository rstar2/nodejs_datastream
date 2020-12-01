/* globals Highcharts:false */

import merge from 'deepmerge';

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

  // export it tom window, so that it could be used from external scripts, or like it is done now form jsdom
  window.highchartsChart = currentChart;
}
