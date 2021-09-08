/**
 * Export given data to file (e.g. client download)
 * @param {string} data
 * @param {string} fileName
 * @param {string} mimeType
 */
export default async function (
  data,
  fileName = 'chart',
  mimeType = 'application/octet-stream'
) {
  return new Promise((resolve) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.setAttribute('download', fileName);

    anchor.addEventListener('click', (e) => e.stopPropagation(), {
      once: true,
    });

    document.body.appendChild(anchor);
    setTimeout(() => {
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve();
      }, 250);
    }, 66);
  });
}
