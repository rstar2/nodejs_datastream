/**
 * Parse given file
 * @param {File} file
 * @return {[[number, number]][]} parsed data ready to be put in a chart
 */
export default async function (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', (event) => {
      resolve(event.target.result); // same as resolve(reader.result);
    });
    reader.addEventListener('error', (event) => {
      alert('Failed to read file!\n\n' + reader.error);
      reject(event.target.error); // same as reject(reader.error);
    });

    reader.readAsText(file);
  });
}
