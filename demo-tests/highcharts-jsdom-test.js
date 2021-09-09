const hc = require('./highcharts-jsdom');

hc({
  inFile: './data/bubble.json',
  outFile: 'chart.svg',

  // Constructor, defaults to 'chart'
  constr: 'chart',

  // Module files etc
  extensions: ['highcharts-more'],
}).then((result) => {
  console.log(result);
});
