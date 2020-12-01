#!/usr/bin/env node

const fs = require('fs');

const { getFileIn } = require('../lib/args');
const { convertFile } = require('../lib/convert');

const fileIn = getFileIn();
const streamOut = fs.createWriteStream(fileIn + '.out');

convertFile(
  fileIn,
  function onLine(lineData) {
    streamOut.write(lineData + '\n');
  },
  function onFinish(error) {
    streamOut.close();
    process.exit(error ? 1 : 0);
  }
);
