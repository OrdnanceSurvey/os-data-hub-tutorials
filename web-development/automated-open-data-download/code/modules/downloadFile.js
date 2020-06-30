const fs = require("fs");
const path = require("path");
const axios = require("axios");
const extract = require("extract-zip");

/* ============================================================
Function: Uses Axios to download file as stream using Promise

/downloadFiles.js
============================================================ */
const download_file = (url, filename) =>
  axios({
    url,
    responseType: "stream"
  }).then(
    (response) =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(filename))
          .on("finish", () => resolve())
          .on("error", (e) => reject(e));
      })
  );

/* ============================================================
Download File

/downloadFiles.js
============================================================ */
async function downloadFile(url, targetdir) {
  try {
    // Giving user ongoing feedback in the terminal:
    console.log("Download starting ...");
    let interval = setInterval(() => console.log("..."), 5000);

    let targetfile = path.resolve(targetdir + ".zip");

    // Wait until the file is fully downloaded
    await download_file(url, targetfile);

    // Now make the target directory, extract the zipped file into it, and delete the downloaded zipfile.
    await fs.mkdirSync(targetdir);
    await extract(targetfile, { dir: path.resolve(targetdir) });
    await fs.unlinkSync(targetfile);

    // Complete!
    clearInterval(interval);
    console.log("Completed downloading files");
  } catch (error) {
    console.error(error);
  }
}

module.exports = downloadFile;
