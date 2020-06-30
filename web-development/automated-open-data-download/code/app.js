const fs = require("fs").promises;
const path = require("path");
const getFilePaths = require("./modules/getFilePaths.js");
const downloadFile = require("./modules/downloadFile.js");
const unzipAll = require("./modules/unzipAll.js");

(async () => {
  const terrain50url =
    "https://osdatahubapi.os.uk/downloads/v1/products/Terrain50/downloads?area=GB&format=ASCII+Grid+and+GML+%28Grid%29&redirect";
  const targetDir = "./working_data";

  // // Await download and unzip:
  await downloadFile(terrain50url, targetDir);
  await unzipAll(targetDir);

  // Now we have a directory with several subdirectories containing, among other files, .asc grids representing elevations of 50m raster cells.
  // Let's extract an array of all paths then filter .asc files in the NG grid square:
  let allPaths = getFilePaths(targetDir);
  let ascPaths = allPaths.filter(
    (filepath) =>
      path.parse(filepath).ext === ".asc" && filepath.includes("/ng/")
  );
  // We'll create a directory to hold our .asc files
  let ascTarget = path.resolve(targetDir, "asc_skye/");
  await fs.mkdir(ascTarget);

  // Then loop through and copy each file into this ./asc folder
  for (let i = 0; i < ascPaths.length; i++) {
    let parsedpath = path.parse(ascPaths[i]);
    let target = path.resolve(ascTarget, parsedpath.base);
    await fs.copyFile(ascPaths[i], target);
    console.log("Copied", parsedpath.base);
  }

  console.log("Completed copying .asc files!");
})();
