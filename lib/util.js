const path = require('path');
const fs = require('fs');

const FORMAT_TYPE = {
  SVG: 'svg',
  PNG: 'png',
  JPEG: 'jpg',
  PDF: 'pdf',
};

exports.FORMAT_TYPE = FORMAT_TYPE;

const MODE_CHART = {
  THREE_POINT_BENDING: '3pt',
  QUASI_STATIC_COMPRESSION: 'quasi',
};

exports.MODE_CHART = MODE_CHART;

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
  const li = fileIn.lastIndexOf(path.sep);
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
