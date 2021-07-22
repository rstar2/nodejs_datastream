const fs = require('fs');
const readline = require('readline');
const { parseLine, ParseError } = require('./parse');

/**
 *
 * @param {String} fileIn
 * @param {Function} onLine
 * @param {Function} onFinish
 */
exports.convertFile = function (fileIn, onLine, onFinish) {
  const streamIn = fs.createReadStream(fileIn);
  const rl = readline.createInterface({
    input: streamIn,

    // Because  If the delay between \r and \n exceeds crlfDelay milliseconds, both \r and \n will be treated as separate end-of-line input.
    // It can be set to Infinity, in which case \r followed by \n will always be considered a single newline
    crlfDelay: Infinity,
  });
  let count = 0;

  console.log(`Convert file ${fileIn}`);

  const finalize = (error) => {
    if (error) {
      console.error('Conversion failed because of', error);
    } else {
      console.log(`Conversion ended successfully: ${count} lines found`);
    }
    streamIn.close();

    onFinish(error, count);
  };

  rl.on('line', (line) => {
    //console.log(`Read line: ${line}`);

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
      return;
    }

    count++;
    onLine(lineData);
  });

  rl.on('error', finalize);
  rl.on('close', finalize);
};
