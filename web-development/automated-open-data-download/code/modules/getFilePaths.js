const fs = require("fs");
const path = require("path");

/** Retrieve file paths from a given folder and its subfolders. */
/* From @darioblanco on https://gist.github.com/kethinov/6658166 */
const getFilePaths = (folderPath) => {
  if (
    fs.statSync(folderPath).isFile() &&
    path.parse(folderPath).ext === ".zip"
  ) {
    return [folderPath];
  }

  // An array of path strings for the contents of the directory
  const entryPaths = fs
    .readdirSync(folderPath)
    .map((entry) => path.join(folderPath, entry));
  // An array of all the files in the directory
  const filePaths = entryPaths.filter((entryPath) =>
    fs.statSync(entryPath).isFile()
  );
  // An array of all the directories in the directory
  const dirPaths = entryPaths.filter(
    (entryPath) => !filePaths.includes(entryPath)
  );
  // Recursively travel down the directory tree, concatenating the contents of each subdirectory
  // dirFiles contains all the files with a directory 'depth' greater than one.
  const dirFiles = dirPaths.reduce(
    (prev, curr) => prev.concat(getFilePaths(curr)),
    []
  );

  // Combine all the paths into a single array with the ES6 spread operator
  return [...filePaths, ...dirFiles];
};

module.exports = getFilePaths;
