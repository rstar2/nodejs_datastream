#!/usr/bin/env node

const fs = require('fs');

const { getFileIn } = require('../lib/args');
const { parseFile } = require('../lib/parse-fs');

const fileIn = getFileIn();
const streamOut = fs.createWriteStream(fileIn + '.out');

parseFile(
  fileIn,
  function onLine(lineData) {
    streamOut.write(lineData + '\n');
  },
  function onFinish(error) {
    streamOut.close();
    process.exit(error ? 1 : 0);
  }
);
