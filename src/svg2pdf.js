import { jsPDF } from 'jspdf';

/**
 * Will only work in browsers
 * @param {string} svg
 * @return {Promise<Blob>|undefined}
 */
export async function getFromSVG(svg) {
  const doc = new jsPDF({format: [1000, 675], orientation: 'landscape'});

  await doc.addSvgAsImage(svg, 0, 0, 1000, 675);

  // save the created pdf
  return doc.output('blob');
}

/**
 * Will only work in browsers
 * @param {string | HTMLImageElement | HTMLCanvasElement | Uint8Array} image
 * @param {string} format
 * @return {Promise<Blob>}
 */
export function getFromImage(image, format = 'PNG') {
  const doc = new jsPDF({ format: [1000, 675], orientation: 'landscape' });

  doc.addImage(image, format, 0, 0, 1000, 675);

  // save the created pdf
  return doc.output('blob');
}
