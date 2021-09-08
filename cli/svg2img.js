const fs = require('fs');

const fileIn = process.argv[2];
if (!fileIn) {
  console.error('No file');
  process.exit(1);
}

console.log('Converting...');

// using sharp
require('sharp')(fileIn)
  .png()
  .toFile(fileIn + '.png')
  .then(console.log)
  .catch(console.error);