/**
 * Convert to a base64 encoded DataUrl (still in SVG format)
 * @param {string} svg
 * @return {string}
 */
export function getSVGImageDataUrl(svg) {
  return 'data:image/svg+xml;base64,' + window.btoa(svg);
}

/**
 * Will only work in browsers, for jsdom the 'canvas' module is required
 * @param {string} svg
 * @param {string} mimetype
 * @param {number} quality
 * @param {boolean} asDataUrl
 * @return {Promise<Blob|string>}
 */
export async function getFromSVG(
  svg,
  { mimetype = 'image/png', quality = 0.92, asDataUrl = false } = {}
) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = function () {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      // Define the canvas intrinsic size
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;

      // Render image in the canvas
      context.drawImage(this, 0, 0, canvas.width, canvas.height);

      // get the Blob image
      if (asDataUrl) {
        const dataUrl = canvas.toDataURL(mimetype, quality);
        resolve(dataUrl);
      } else {
        canvas.toBlob(
          (blob) => {
            if (!blob) reject(new Error('Could not produce a blob'));
            else resolve(blob);
          },
          mimetype,
          quality
        );
      }
    };

    image.src = getSVGImageDataUrl(svg);
  });
}

/**
 * Will only work in browsers, for jsdom the 'canvas' module is required
 * @param {string} svg
 * @return {Promise<HTMLImageElement>|HTMLCanvasElement}
 */
export async function getCanvas(svg) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = function () {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      // Define the canvas intrinsic size
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;

      // Render image in the canvas
      context.drawImage(this, 0, 0, canvas.width, canvas.height);

      resolve(canvas);
    };

    image.src = getSVGImageDataUrl(svg);
  });
}
