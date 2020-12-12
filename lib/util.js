const FORMAT_TYPE = {
  SVG: 'svg',
  PNG: 'png',
  JPEG: 'jpg',
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
