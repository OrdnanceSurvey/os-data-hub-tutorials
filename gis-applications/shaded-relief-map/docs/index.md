Maps convey information about space. Landforms are characterised by their topography - "the arrangement of the natural and artificial physical features of an area" ([Oxford](https://www.lexico.com/en/definition/topography)). The location of mountains, hills, valleys, gorges and other features are often relevant to a map reader, and can be difficult to represent on a flat map.

Shaded relief maps include this information about topography by emphasising the variation in land elevation, using shadows to indicate the position of hills and valleys. These maps include a "hillshade" layer, created by analysing a Digital Elevation Model, which is a dataset that contains information about land elevation at regularly-spaced points.

_image of hillshade_

This tutorial will walk through how to create a shaded relief map using Ordnance Survey's Terrain 50 dataset, available for free download via the OS Downloads API. We'll pick up where the [Automated Open Data Download](#) tutorial left off, bringing DEM data into QGIS, merging tiles, removing ocean areas, creating a hillshade image, then building a shaded relief map.

## Getting started

We'll start with a folder containing the OS Terrain 50 Digital Elevation Model raster tiles around the Isle of Skye. This is picking up from the [Automated Open Data Download](#) tutorial, where you can download and extract the DEM tiles we'll use.

Alternatively, you can download the Terrain 50 ASCII Grid from the Downloads API at [this link](https://osdatahubapi.os.uk/downloads/v1/products/Terrain50/downloads?area=GB&format=ASCII+Grid+and+GML+%28Grid%29&redirect). (Clicking this will prompt the download of a ~150MB zipfile!)

Once downloaded, extract the zipped folder, find the `terr50_gagg_gb/data/ng` folder, and go through and unzip all the tile folders. We'll be using all the `.asc` files in the `ng/` subdirectories. (This repetitive unzipping and copying these files is exactly why we wrote the Automated Open Data Download tutorial - it is easy with code!)

We did include a zipped folder with just the `.asc` files we're using in [./data/asc_skye.zip](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/data/asc_skye.zip) - so if you want to get straight to the analysis, you can just use that.

We're using QGIS3 - if you haven't installed it, you can find it [here](https://qgis.org/en/site/). Open up the program and create a `New Empty Project`.

Drag and drop all the `.asc` files into the QGIS layers pane. Each file should appear in the pane, along with a tiled image of the land area in the viewport. We'll go through a few steps to get our map ready.

### Merge tiles

We can see all the tiles, but they are separate, and the borders are often visible due to differing altitude ranges from tile to tile. The highest point in a tile will appear white, whether it is 20m or 2000m above sea level. The dataset covers all land area in Britain, so tiles that are only water are not included.

![Unmerged DEM](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/media/unmerged-dem.png)

To solve this we'll merge the DEM tiles into a single raster image. Select `Raster > Miscellaneous > Merge...` from the menu; a dialogue box will pop up. First add all the tiles as the input elements with the `...` button next to the input layers text box. (Note: in some versions of QGIS for Mac, pressing `OK` sometimes moves the `Merge` textbox behind the main window, so you may have to move it back to the front.)

Leave the other parameters as-is and click `Run`. The console will show output as the tiles are merged, and a layer called `Merged` should be added to the `Layers` pane, and a black-and-white image should appear over top the tiles we added. Close the `Merge` popup and examine the new merged raster image. Notice how you can no longer see the edges of the individual tiles - as before, the highest point in the merged tile is white, and the lowest is black.

![Merged DEM](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/media/merged-dem.png)

You can now remove the individual tiles from the Layers panel by selecting them all and `right-click > Remove Layer...`. This will clean up your interface, but won't delete the original data from your disk.

![Remove layers](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/media/remove-layers.png)

### Removing `nodata`

To make sure the output hillshade only shows land area we need to remove the nodata values, which represent sea area. To do this, right click on the `Merged` layer and select `Export > Save As`. Choose a filename and location to save, then scroll down and toggle the `No data values` checkbox, add a row with the green `+` and input `-2.3` to `0` as the range.

Clicking `OK` will create a new raster layer with the `nodata` (i.e. sea) values excluded. This DEM representing the landforms of western Scotland is ready for our analysis.

![Raster with nodata values.](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/media/removing-nodata.png)

(Note - there are [other ways](https://gis.stackexchange.com/questions/197446/gdal-set-negative-values-to-nodata-or-nan) to remove nodata at other steps in this process, but this solution worked well in this case.)

### Create the hillshade layer

In the digital elevation model we created with the `nodata` pixels removed, each grid cell has a numerical value representing the average height of that terrain area in meters above sea level. Uncheck the `Merged` layer to see the landform outlines - these are all pixels with elevations > 0.

A hillshade analysis calculates the amount of light reflecting off of a grid cell based on its elevation, and the elevation of surrounding cells. To do so, the algorithm is provided the raster grid, along with parameters including the `azimuth` and `altitude` of the light source, as well as vertical exaggeration (`ZFactor`), and `scale`.

Select the `Raster > Analysis > Hillshade` option from the main menu - a dialogue to configure the parameters of the hillshade analysis will appear.

Feel free to play around with these parameters to create a hillshade image you like. We used the following settings for our map, to simulate morning on the west coast:

| Parameter                  | Value   |
| -------------------------- | ------- |
| `azimuth`                  | 115     |
| `altitude`                 | 35      |
| `ZFactor`                  | 1.5     |
| `scale`                    | 1       |
| `Compute edges`            | `true`  |
| `ZevenbergenThorne`        | `true`  |
| `Combined shading`         | `true`  |
| `Multidirectional shading` | `false` |

![Hillshade analysis dialogue](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/media/hillshade-options.png)

`Run` generates the hillshade image layer from the `Merged` raster and the input parameters and adds it to the map.

![Initial hillshade output](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/media/initial-hillshade.png)

### Styling in QGIS

A last bit of styling and we have a shaded relief map of the Isle of Skye!

These parameters are entirely up to you, so tune and toggle until you find an aesthetic that suits your use.

First, we'll apply a style to the Terrain 50 DEM layer. Rather than the basic black-to-white gradient, we created one that will emphasise the different terrain altitudes - white at the lowest points, moving through a muted brown, to a subtle forest green, then light grey at the mountain tops.

We will work on the `Merged` raster, which incudes the ocean and water surfaces as values less than 0.

Access this image's Layer Properties dialogue by right-clicking on the DEM layer and selecting `Properties`, then the `Symbology` tab. Change `Render type` to `Singleband pseudocolor`, then click the `Color ramp` dropdown and select `Create new color ramp`. Select `Gradient` and create your own color ramp. You can click just below the ramp to add stops and select colors within `Gradient Stop`.

Once you have your color ramp, click `Classify` so each stop on the ramp is added to the list of labels. Finally, click `Apply` to update the rendered layer and see your work visualized.

We adjusted the lower blue cut-off value to 0 so only cells below sea level would appear as water.

![DEM Layer Properties dialogue](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/media/dem-layer-properties.png)

![color gradient](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/media/color-ramp.png)

The last step is styling the hillshade layer we created with our analysis. Make sure this layer is on top of the Terrain 50 layer we just styled, and open the `Layer Properties > Symbology` interface again.

Switch `Blending mode` to `Multiply` and increase `Brightness` a bit. We also switched the Resampling mode to `Bilinear` in, `Average` out.

As the last step, we set the overall `Transparency` of the layer to 50%.

There we go - a shaded relief map of western Scotland, focused on the Isle of Skye. Data collected from the OS Downloads API with NodeJS, analysis done in QGIS.

![Shaded relief map](https://raw.githubusercontent.com/johnx25bd/os-data-hub-api-tutorials/master/gis-applications/shaded-relief-map/media/final-hillshade.png)

If you make a beautiful map using OS data - let us know!
