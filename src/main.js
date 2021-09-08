import * as chart from './chart.js';
import readFile from './read_file.js';
import { parseFile } from '../lib/parse.js';
import exportFile from './export_file.js';

const fileSelectEl = document.getElementById('fileSelect');
const fileUploadEl = document.getElementById('fileUpload');
const exportSVGEl = document.getElementById('exportSVG');
const exportPNGEl = document.getElementById('exportPNG');

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

  // NOTE: Currently this is not needed (this is just for testing) so let then stay invisible,
  // the built-in export is enough,
  // show the buttons as they are initially hidden
  //   exportSVGEl.style.display = '';
  //   exportPNGEl.style.display = '';
});

exportSVGEl.addEventListener('click', exportChart);
exportPNGEl.addEventListener('click', exportChart);

/**
 *
 * @param {Event} event
 */
function exportChart(event) {
  const isPNG = event.target === exportPNGEl;

  console.log(`Export to ${isPNG ? 'PNG' : 'SVG'}`);
  let data = chart.getSVG();
  if (isPNG) {
    // TODO: convert to PNG in client if needed
    // data = ...;
    throw new Error('Not implemented yet');
  }

  exportFile(
    data,
    `chart.${isPNG ? 'png' : 'svg'}`,
    `image/${isPNG ? 'png' : 'svg+xml'}`
  );
}

// export to window, so that they could be used from external scripts,
// or like it is done now from 'jsdom' (it doesn't support ES modules)
window.chart = chart;
