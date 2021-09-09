const fs = require('fs');

const FORMAT_TYPE = {
  SVG: 'svg',
  PNG: 'png',
  JPEG: 'jpg',
  PDF: 'pdf',
};

const STRATEGY_TYPE = {
  NO: 'no',
  SMOOTH: 'smooth',
  SKIP: 'skip',
};

exports.FORMAT_TYPE = FORMAT_TYPE;
exports.STRATEGY_TYPE = STRATEGY_TYPE;

/**
 * Create a function 'isValid(str: String) : boolean'
 * @param {Object} obj
 * @return {Function<boolean>}
 */
exports.createIsValid = (obj) => (str) => Object.values(obj).includes(str);

/**
 * @param {string} fileIn
 * @return {boolean}
 */
exports.isValidFile = (fileIn) => {
  return fs.existsSync(fileIn) && fs.lstatSync(fileIn).isFile();
};

/**
 * @param {string} fileIn
 * @return {string}
 */
exports.getLastName = (fileIn) => {
  const li = fileIn.lastIndexOf('/');
  if (li !== -1) fileIn = fileIn.substr(li + 1);
  return fileIn;
};

/**
 * @param {string} fileIn
 * @return {string}
 */
exports.removeExtension = (fileIn) => {
  const li = fileIn.lastIndexOf('.');
  if (li !== -1) fileIn = fileIn.substr(0, li);
  return fileIn;
};
