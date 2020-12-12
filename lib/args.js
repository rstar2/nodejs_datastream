const fs = require('fs');

const { FORMAT_TYPE, STRATEGY_TYPE, createIsValid } = require('./util');

const strategyKey = 's';
const formatKey = 'f';
const verboseKey = 'v';
const helpKey = 'h';
const argsOptions = {
  boolean: [verboseKey, helpKey],
  string: [strategyKey, formatKey],
  default: {
    [strategyKey]: STRATEGY_TYPE.SMOOTH, // strategy
    [formatKey]: FORMAT_TYPE.PNG, // format
    [verboseKey]: false, // verbose
    [helpKey]: false, // help
  },
  alias: {
    [helpKey]: 'help',
  },
  unknown() {
    // don't add any unknown into 'argv', could fail
    return true;
  },
};
const argv = require('minimist')(process.argv.slice(2), argsOptions);
// console.log(process.argv);
// console.log(argv);

// Usage:
// $ node chart.js -h
// $ node chart.js --help
// $ node chart.js -s no data.txt
// $ node chart.js --s=no data.txt
// $ node chart.js -f jpg data.txt
const usage = `Usage:
    chart [-s strategy] [-f format] [-v] [-h] file
    chart [--s=strategy] [--f=format] [-v] [-h] file
Where:
  options:
    ${strategyKey}    - optional strategy - can one of "${Object.values(
  STRATEGY_TYPE
)}", default is ${argsOptions.default[strategyKey]}
    ${formatKey}    - optional exported image format - can be one of "${Object.values(
  FORMAT_TYPE
)}", default is ${argsOptions.default[formatKey]}
    ${verboseKey}    - more verbose traces if set 
    ${helpKey}    - print this message 
  arguments:
    file - the datastream file for which to generate a chart
`;

const exit = (error) => {
  if (error) console.error(error);
  console.error(usage);
  process.exit(error ? 1 : 0);
};

if (argv[helpKey]) exit();

const fileIn = argv._[0];
const strategy = argv[strategyKey];
const format = argv[formatKey];

// validations
if (!fileIn) {
  exit('No file to convert');
}
// fileIn = require('path').resolve(process.cwd(), fileIn);
if (!(fs.existsSync(fileIn) && fs.lstatSync(fileIn).isFile())) {
  exit(`Invalid file to convert: ${fileIn}`);
}
if (!createIsValid(STRATEGY_TYPE)(strategy)) {
  exit(`Invalid strategy: ${strategy}`);
}
if (!createIsValid(FORMAT_TYPE)(format)) {
  exit(`Invalid format: ${format}`);
}

/**
 * Parsed and validated argument values
 * @type {strategy: String, format: String, fileIn: String} always valid
 */
module.exports = {
  strategy,
  format,
  fileIn,
};
