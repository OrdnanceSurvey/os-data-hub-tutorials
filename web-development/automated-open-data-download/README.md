# Automated Open Data Download

In this tutorial we'll collect Ordnance Survey data from the Downloads API with an automated download and extract process.

## Tools and APIs

We will walk through how to fetch the OS Terrain50 Digital Elevation Model (DEM) dataset from the OS Downloads API using NodeJS and the command line, then unzipping and extracting all of the appropriate `.asc` files into a single folder.

We will be using:

- NodeJS and npm, with [axios](https://github.com/axios/axios) and [extract-zip](https://www.npmjs.com/package/extract-zip) npm packages; `fs` and `path` standard modules.
- Command line

## Tutorial

Working with large datasets can be a challenge. With a few programming tools, however, we can radically improve the efficiency of collecting and manipulating these datasets.

We'll be using NodeJS to download and extract Ordnance Survey's Terrain50 Digital Elevation Model dataset from the [OS Downloads API](https://osdatahub.os.uk/docs/downloads/overview).

1. Download zipped directory with the data.
2. Unzip all contained zipped directories.
3. Copy all `.asc` files into one folder, ready to be loaded into QGIS for our [Shaded Relief Map tutorial](https://github.com/johnx25bd/os-data-hub-api-tutorials/tree/master/gis-applications/shaded-relief-map).

This tutorial was created using NodeJS v14.1.0. If you don't already have Node installed, [here is a great tutorial](https://www.taniarascia.com/how-to-install-and-use-node-js-and-npm-mac-and-windows/) on installing Node and npm on Windows and Mac.

This tutorial will walk you through creating this code from scratch. If you would rather download, install and run it all, there are instructions for that [at the bottom](#download-install-and-run) of this page.

### Download & Extract

First, we'll download the Terrain 50 dataset from the OS Downloads API. In your terminal, make a directory where you'll want to store your project. At the outset we'll install the [`axios`](https://github.com/axios/axios) package from NPM, which is used for HTTP requests, and [`extract-zip`](https://www.npmjs.com/package/extract-zip), which we'll use a bit later on for extracting zipped folders.

```bash
mkdir os-downloads-tutorial
cd os-downloads-tutorial

npm install axios extract-zip
```

If you're not familiar with Node, this `npm install {package names}` command will create a `node_modules` folder and download packages there.

### Download File

We'll be breaking our Node program into modules to keep it organised. For our first step - downloading the dataset - create a file called `downloadFile.js` in the `os-downloads-tutorial` directory.

We'll be using the `fs` module to write data to the disk as it downloads via an `axios` HTTP request.

```javascript
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
```

This function will fetch the resource at the `url` passed in, and write the file returned to the local directory as `filename`. We will call it from the function we'll export, adding in some error handling and visual feedback so the user knows the file is downloading. We'll also unzip the downloaded file into the `targetdir`.

In the same file, below the `download_file` declaration, create the following function:

```javascript
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

module.exports = downloadFile; // <- so we can import the function into another script
```

### Recursive Unzip

Before we import and call the code above, we'll also define a script that will unzip all the zipped folders in the downloaded zipfile.

Create a file called `unzipAll.js`. This function will accept one parameter - a path to a directory (zipped or not). We'll then pull paths of all contained zipfiles, extract the contents, and delete the zipfiles. Since zipped directories can contain zipped sub-directories and files, we need to execute this recursively until all files ending in `.zip` are extracted and deleted.

```javascript
// Import dependencies, including the extract-zip module we installed with npm
const fs = require("fs");
const path = require("path");
const extract = require("extract-zip");
const getFilePaths = require("./getFilePaths.js");

async function unzipAll(dir) {
  dir = path.resolve(dir);

  // Create an array of all .zip file paths in the directory:
  let filepaths = getFilePaths(dir);
  filepaths = filepaths.filter((filepath) => path.extname(filepath) === ".zip");

  // Loop through filepaths, extracting and deleting each:
  while (filepaths.length > 0) {
    for (let file of filepaths) {
      let parsedpath = path.parse(file);
      let targetdir = path.resolve(parsedpath.dir);

      try {
        // Unzip the compressed file into a directory with the same name
        await extract(file, { dir: targetdir });
        await fs.unlinkSync(file); // <- delete the .zip file
        console.log("Unzipped", parsedpath.base + ", deleted .zip file.");
      } catch (err) {
        console.log(err);
      }
    }

    // If the extracted folders contained zipfiles, they'd be included here:
    filepaths = getFilePaths(dir);
    filepaths = filepaths.filter(
      (filepath) => path.extname(filepath) === ".zip"
    );
  }
}

// Since we'll be importing it into our main JS file, we export the function:
module.exports = unzipAll;
```

### `getFilesPaths()`

You'll notice we required a module to `unzipAll` - `getFilePaths.js`.

This function accepts a directory path string, then loops through the directory, building an array of all the paths to directories and files contained.

A note: this is another recursive function - one that calls itself. In this way it is able to move through the directory structure no matter its depth.

```javascript
const fs = require("fs");
const path = require("path");

/** Retrieve file paths from a given folder and its subfolders. */
/* Big thanks to @darioblanco on https://gist.github.com/kethinov/6658166 
    for sharing this code!! */
const getFilePaths = (folderPath) => {
  // Edge case: if a .zip file is passed in, we'll return that ready to unzip
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
```

Now we've downloaded the DEM data from the OS Downloads API and unzipped all the contained files. It _should_ be ready to bring into QGIS.

### `app.js`

Let's put this all together in a new file, `/app.js`. We'll import the modules we need - Node's `fs` and `path`, along with the custom modules we wrote above.

We don't want to have to click through every single folder to select the `.asc` files we need to load into QGIS - and QQGIS won't accept a directory containing loads of subdirectories and files of different types.

Fortunately, with Node - and the code we've already written - we can easily copy all the `.asc` files from their locations in the directory structure into one folder. (This could be done with many other programming languages like Python, bash, Ruby, C++ - the power of code.)

We will place all of this code inside the body of an [asynchronous immediately-invoked function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/async_function), which you can see in `/app.js`.
By wrapping the function expression in parentheses, we can immediately invoke it (with or without arguments): `(function (param) { /* body ...*/})(arg)`

This pattern is necessary for us to be able to use `async / await` syntax, which makes it clean and easy to write code that will halt until the end of processes like downloading a large file.

```javascript
// app.js
const fs = require("fs").promises;
const path = require("path");
const getFilePaths = require("./getFilePaths.js");
const downloadFile = require("./downloadFile.js");
const unzipAll = require("./unzipAll.js");

// We use an IIFE because`await` can only work inside an `async` function.
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
})(); // <- Invoke the function immediately!
```

### Running the program

We now have a complete Node program and modules, which we can execute by running `node app.js` on the command line in our `os-downloads-tutorial` directory.

This may take a little time as the OS Terrain 50 dataset is 161MB. Once this is completed, there should be a new folder, `working_data/asc_skye` with the `.asc` files, ready to work with in QGIS. If you want to complete the tutorial and create a shaded relief map with the DEM data downloaded, find the tutorial [here](https://github.com/johnx25bd/os-data-hub-api-tutorials/tree/master/gis-applications/shaded-relief-map).

## Download, install and run

If you'd rather just download and run the code we described in the tutorial, you can clone the repository, install the npm packages and run it using the following commands:

```bash
git clone https://github.com/johnx25bd/os-data-hub-api-tutorials.git
cd os-data-hub-api-tutorials/web-development/automated-open-data-download/code
npm install

node app.js
```

If all goes well you'll see the console printing statements as the download and extract process starts!

Let us know if you automate a process fetching, manipulating, analysing or storing OS data - we'd love to know. Tweet at [@OrdnanceSurvey](https://twitter.com/ordnancesurvey) and tag [#OSDeveloper](https://twitter.com/hashtag/OSDeveloper).
