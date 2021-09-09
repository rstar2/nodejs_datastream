/**
 * Will only work in browsers, for jsdom the 'canvas' module is required
 * @param {string} svg
 * @param {string} mimetype
 * @param {string} quality
 * @return {Promise<Blob>}
 */
export default async function (svg, mimetype = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    let svgBase64 = 'data:image/svg+xml;base64,' + window.btoa(svg);

    const image = new Image();

    image.onload = function () {
      let canvas = document.createElement('canvas');
      let context = canvas.getContext('2d');
      // Define the canvas intrinsic size
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;

      // Render image in the canvas
      context.drawImage(this, 0, 0, canvas.width, canvas.height);

      // get the Blob image
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error('Could not produce a blob'));
          else resolve(blob);
        },
        mimetype,
        quality
      );
    };

    image.src = svgBase64;
  });
}
