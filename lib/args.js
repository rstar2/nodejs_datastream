const fs = require('fs');

const {
  FORMAT_TYPE,
  createIsValid,
  isValidFile,
  getLastName,
  removeExtension,
} = require('./util');

const MAX_FILES = 9;

const nameKey = 'n';
const formatKey = 'f';
const verboseKey = 'v';
const helpKey = 'h';
const argsOptions = {
  boolean: [verboseKey, helpKey],
  string: [formatKey, nameKey],
  default: {
    [formatKey]: FORMAT_TYPE.SVG, // format
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
// $ node chart.js -f pdf data.txt
// $ node chart.js -f pdf -n output data1.txt
// $ node chart.js -f pdf -n output data1.txt data2.txt
// $ node chart.js --f=pdf data
const usage = `Usage:
    chart [-f format] [-v] [-h] file1 file2 file2 ... file10
    chart [--f=format] [-v] [-h] file1 file2 file2 ... file10
    chart [--f=format] [-v] [-h] folder
Where:
  options:
    ${formatKey}    - optional exported image format - can be one of "${Object.values(
  FORMAT_TYPE
)}", default is ${argsOptions.default[formatKey]}
    ${verboseKey}    - more verbose traces if set 
    ${helpKey}    - print this message 
    ${nameKey}    - the output name, note that the proper extension will be added according the format  
  arguments:
    file1...file10  - data files for which to generate a chart. If passed more than ${MAX_FILES}, the rest will be skipped
    folder          - folder containing the data files (with TXT or LOG extensions only) for which to generate a chart. The first ${MAX_FILES} valid are used, the rest will be skipped
`;

/**
 */
function exit(error) {
  if (error) console.error(error);
  console.error(usage);
  process.exit(error ? 1 : 0);
}

if (argv[helpKey]) exit();

// 🏳🏳 Latest requirements are so that only SVG is needed
const format = FORMAT_TYPE.SVG; // argv[formatKey];

if (!createIsValid(FORMAT_TYPE)(format)) {
  exit(`Invalid format: ${format}`);
}

let files = argv._;

// validations
if (!files.length) {
  exit('No file(s)/folder to convert');
}

/**
 * @type {string|undefined}
 */
let title = undefined;
/**
 * @type {string|undefined}
 */
let fileOut = argv[nameKey];

if (fileOut && !fileOut.includes('.')) fileOut += '.' + format;

if (files.length === 1) {
  const fileIn = files[0];

  if (!fs.existsSync(fileIn)) exit(`Invalid folder/file to convert: ${fileIn}`);

  if (fs.lstatSync(fileIn).isDirectory()) {
    files = [];

    // list folder's files
    const dirTree = require('directory-tree');
    const tree = dirTree(fileIn, { extensions: /\.(txt|log|csv)$/i });
    if (tree.children) {
      files = tree.children
        .filter((item) => item.type === 'file')
        .map((item) => item.path);
    }
    title = tree.name;
    // get only the last name of the file not the whole, e.g from  "data/subfolder" make "subfolder"
    title = getLastName(title);
  } else if (isValidFile(fileIn)) {
    title = fileIn;
    // get only the last name of the file not the whole, e.g from  "data/file.txt" make "file.txt"
    title = getLastName(title);
    // remove extension
    title = removeExtension(title);
  } else {
    exit(`Invalid file to convert: ${fileIn}`);
  }

  if (!fileOut) fileOut = title + '.' + format;
} else {
  // filter valid files only
  files = files.filter((fileIn) => {
    if (!isValidFile(fileIn)) {
      console.error(`Invalid file: ${fileIn}`);
      return false;
    }
    return true;
  });
  // no title for multiple
  // title = ;
  if (!fileOut) fileOut = 'chart.' + format;
}

// convert max 10 files
files = files.slice(0, MAX_FILES);

if (!files.length) exit('No valid files to convert');

// fileIn = require('path').resolve(process.cwd(), fileIn);

/**
 * Parsed and validated argument values
 * @type {format: string, fileOut: string, files: string[], title?: string} always valid
 */
module.exports = {
  format,
  files,
  fileOut,
  title,
};
