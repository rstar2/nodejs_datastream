const fs = require('fs');

/**
 * @return {String} always valid
 */
function getFileIn() {
  let fileIn = process.argv[2];

  if (!fileIn) {
    console.error('Missing file to convert');
    process.exit(1);
  }

  // fileIn = require('path').resolve(process.cwd(), fileIn);
  if (!(fs.existsSync(fileIn) && fs.lstatSync(fileIn).isFile())) {
    console.error(`Invalid file to convert: ${fileIn}`);
    process.exit(1);
  }

  return fileIn;
}

exports.getFileIn = getFileIn;
