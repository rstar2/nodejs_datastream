import * as chart from './chart.js';
import readFile from './read_file.js';
import svg2blob from './svg2blob';
import exportFile from './export_file.js';
import { parseFile } from '../lib/parse.js';
import { FORMAT_TYPE } from '../lib/util';

const fileSelectEl = document.getElementById('fileSelect');
const fileUploadEl = document.getElementById('fileUpload');
const exportSVGEl = document.getElementById('exportSVG');
const exportPNGEl = document.getElementById('exportPNG');
const exportPDFEl = document.getElementById('exportPDF');

// when clicked trigger the file-input select
fileSelectEl.addEventListener('click', fileUploadEl.click.bind(fileUploadEl));

// when file is selected
fileUploadEl.addEventListener('change', async (event) => {
  // get the selected files
  let /* File[] */ files = event.target.files;
  if (!files || !files.length) return;

  // covert FileList to File[]
  files = Array.from(files);
  let listData = await Promise.allSettled(
    files.map(async (file) => {
      return {
        data: await readFile(file),
        name: file.name,
      };
    })
  );
  listData = listData
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
    .map(({ data, name }) => {
      return {
        points: parseFile(data),
        name,
      };
    });
  //   console.log('data', data);

  chart.update(listData, {
    title: listData.length === 1 ? listData[0].name : undefined,
  });

  // the built-in export is enough,
  // show the buttons as they are initially hidden
  exportSVGEl.style.display = '';
  exportPNGEl.style.display = '';
  exportPDFEl.style.display = '';
});

exportSVGEl.addEventListener('click', exportChart);
exportPNGEl.addEventListener('click', exportChart);
exportPDFEl.addEventListener('click', exportChart);

/**
 *
 * @param {Event} event
 */
async function exportChart(event) {
  const format = event.target.dataset['format'];

  console.log(`Export to ${format}`);

  const svg = chart.getSVG();

  let data, mimetype, extension;
  switch (format) {
    case FORMAT_TYPE.SVG:
      extension = 'svg';
      mimetype = 'image/svg+xml';
      data = svg;
      break;
    case FORMAT_TYPE.PNG: {
      extension = 'png';
      mimetype = 'image/png';
      data = await svg2blob(svg);
      break;
    }
  }

  await exportFile(data, `chart.${extension}`, mimetype);
}

// export to window, so that they could be used from external scripts,
// or like it is done now from 'jsdom' (it doesn't support ES modules)
window.chart = chart;
