import * as chart from './chart.js';
import readFile from './read_file.js';
import { parseFile } from '../lib/parse.js';

const fileSelectEl = document.getElementById('fileSelect');
const fileUploadEl = document.getElementById('fileUpload');

// when clicked trigger the file-input select
fileSelectEl.addEventListener('click', fileUploadEl.click.bind(fileUploadEl));

// when file is selected
fileUploadEl.addEventListener('change', async (event) => {
  // get the single selected file
  const file = event.target.files[0];
  if (!file) return;

  let data = await readFile(file);
  data = parseFile(data);
  //   console.log('data', data);
  chart.update(data);
});

// export it tom window, so that it could be used from external scripts, or like it is done now form jsdom
window.chart = chart;
