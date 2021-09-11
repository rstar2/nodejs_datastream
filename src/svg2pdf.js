import { jsPDF } from 'jspdf';

/**
 * Will only work in browsers
 * @param {string} svg
 * @param {[number, number]} format
 * @param {'landscape'|'portrait'} orientation
 * @return {Promise<Blob>|undefined}
 */
export async function getFromSVG(svg, format, orientation = 'landscape') {
  const doc = new jsPDF({ format, orientation });

  await doc.addSvgAsImage(svg, 0, 0, ...format);

  // save the created pdf
  return doc.output('blob');
}

/**
 * Will only work in browsers
 * @param {string | HTMLImageElement | HTMLCanvasElement | Uint8Array} image
 * @param {[number, number]} size
 * @param {'landscape'|'portrait'} orientation
 * @param {string} imageType
 * @return {Promise<Blob>}
 */
export function getFromImage(
  image,
  format,
  orientation = 'landscape',
  imageType = 'PNG'
) {
  const doc = new jsPDF({ format, orientation });

  doc.addImage(image, imageType, 0, 0, ...format);

  // save the created pdf
  return doc.output('blob');
}
