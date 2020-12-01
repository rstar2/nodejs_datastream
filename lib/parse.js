/**
 * Parse a single line.
 * Example:
 *   in  =>  288 86 0 0
 *   out =>  288,86
 * @param {String} line
 * @return {[number, number]|null}
 */
const parseLine = function (line) {
  line = line.trim();
  if (!line) return null;

  const parts = line.split(' ');
  if (parts.length >= 2) {
    return [+parts[0], +parts[1]];
  }

  return null;
};

/**
 *
 * @param {String} lines
 * @return {[number, number][]}
 */
const parseFile = function (lines) {
  return lines.split(/\r?\n|\r(?!\n)/).reduce((res, line) => {
    const entry = parseLine(line);
    entry && res.push(entry);
    return res;
  }, []);
};

exports.parseLine = parseLine;
exports.parseFile = parseFile;
