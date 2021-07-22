const ParseError = {
  Empty: 'Empty',
  Comment: 'Comment',
  InvalidPattern: 'InvalidPattern',
  InvalidNumbers: 'InvalidNumbers',
};

/**
 * Parse a single line.
 * Example:
 *   in  =>  "288 86"
 *   out =>  [288,86]
 * @param {String} line
 * @return {[number, number]|string} array if validly parsed, otherwise an error string
 */
const parseLine = function (line) {
  line = line.trim();
  // skip empty lines
  if (!line) return ParseError.Empty;
  // skip comments
  if (line.startsWith('#')) return ParseError.Comment;

  const parts = line.split(' ');
  // skip errors
  if (parts.length !== 2) return ParseError.InvalidPattern;

  // try to "covert" them to numbers
  let x = +parts[0];
  let y = +parts[1];
  // skip errors
  if (Number.isNaN(x) || Number.isNaN(y)) return ParseError.InvalidNumbers;

  // this is a valid point of numbers
  return [x, y];
};

/**
 *
 * @param {String} lines
 * @return {[number, number][]}
 */
const parseFile = function (lines) {
  return lines.split(/\r?\n|\r(?!\n)/).reduce((res, line) => {
    const lineData = parseLine(line);

    if (typeof lineData === 'string') {
      // so this is "error" line, e.g. lineData is the error string
      switch (lineData) {
        case ParseError.Empty:
        case ParseError.Comment:
          // skip these "normal" errors
          break;
        default:
          console.error(`Parsing of line "${line}" failed with: ${lineData}`);
      }
    } else {
      res.push(lineData);
    }

    return res;
  }, []);
};

module.exports = {
  ParseError,
  parseLine,
  parseFile,
};
