2D maps are informative, however viewing the same data in 3D adds a
whole new level of context. We are going to use various Ordnance Survey
products combined with third party datasets to create a rich interactive
3D model.

<p align="center">
  <video style="outline:none" width="700" poster="/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image1.png" controls disablepictureinpicture controlslist="nodownload">
    <source src="/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/OS_EA_Tutorial.mp4" type="video/mp4">
    Your browser does not support HTML5 video.
  </video>
</p>

Tools and APIs
----

The following resources are used in creating the 3D model:

- OS Maps API - [osdatahub.os.uk](https://osdatahub.os.uk/)
- OS Open ZoomStack - [osdatahub.os.uk - downloads](https://osdatahub.os.uk/downloads/OpenZoomstack)
- Environment Agency - [environment.data.gov.uk](https://environment.data.gov.uk/DefraDataDownload/?Mode=survey)
- Environment Agency Flood Risk Zones - [Risk of Flooding from Rivers and Sea](https://environment.data.gov.uk/arcgis/rest/services/EA/RiskOfFloodingFromRiversAndSea/MapServer)

The software used will be ArcGIS Pro 2.5 but similar processes and
techniques are available in other GIS software. All the data is freely
available and includes OS Maps API, OS Open ZoomStack, Environment
Agency (EA) Lidar DTM and flood risk zones.

*Alternatives:* If you have access to OS Premium products then OS Open
ZoomStack can be substituted by OS MasterMap Topographic Area (filter on
buildings). Terrain data that has complete GB coverage can be found in
the form of [OS Terrain
5](https://www.ordnancesurvey.co.uk/business-government/products/terrain-5)
(5m grid resolution). Alternatively, [OS Terrain
50](https://osdatahub.os.uk/downloads/Terrain50) (50m grid resolution)
is also available to download for free from OS Data Hub.

Tutorial
----

Firstly, we are going to obtain data from the relevant Ordnance Survey
and Environment Agency platforms. Head over to
[osdatahub.os.uk](https://osdatahub.os.uk/), sign up and create a
project (using the API Dashboard and API options) that includes the `OS
Maps API`. Once created this project will contain your API Key and
Endpoint that will be used later. Whilst still on OS Data Hub, download
a copy of [OS Open
ZoomStack](https://osdatahub.os.uk/downloads/OpenZoomstack) as a
GeoPackage from the `Download` page - we will include the Local Buildings
layer as part of the 3D model.

The Environment Agency (EA) have several useful datasets available on
their
[platform](https://environment.data.gov.uk/DefraDataDownload/?Mode=survey)
-- we choose to download the Lidar Composite DTM 2017 2m dataset for the
area surrounding Cheddar in Somerset (tiles ST45NW/NE/SW/SE). A summary
of this dataset can be found
[here](https://data.gov.uk/dataset/fba12e80-519f-4be2-806f-41be9e26ab96/lidar-composite-dsm-2017-2m).

Digital Terrain Model (DTM)
---------------------------

Once you have downloaded the EA DTM data, use the tools you are familiar
with to merge the rasters together - we used the `Mosaic To New Raster`
tool within ArcGIS Pro. The EA data captured in 2017 only focuses on
those areas that are effected by flooding and therefore contains 'gaps'
(work is underway to complete full coverage of England by 2021) -- we
used the `Clip Raster` tool to clip the data to the relevant study area.

![Clipping raster layer](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image2.jpg)

Loading the data
----------------
![OS Maps API](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image3.png)

It is now time to prepare the data ready to be converted into a 3D
model. Create a new project in ArcGIS Pro and remove any
basemaps. Select `Insert` from the top tab menu and follow this procedure
to inset the OS Maps API:

-   `Project/Connections`
-   `New WMTS Server`
-   `Service URL <copy API Endpoint address from OS DataHub>`

A connection to all available basemaps in the OS Maps API can now be
found in the .wmts connection under the Servers folder in Catalog. Add
the Outdoor\_27700 option to the map.

Whilst still in Catalog, navigate to where you saved your merged DTM
raster and add to the map. Also, open `OS Open ZoomStack` and add the
`Local Building` layer to the map (optional: clip buildings to the study
area).

Finally, as the EA data was collected in relation to flooding, it would
be appropriate to include a flood related dataset. Use the Living Atlas
(under Portal) to search for EA's [Risk of Flooding from Rivers and
Sea](https://environment.data.gov.uk/arcgis/rest/services/EA/RiskOfFloodingFromRiversAndSea/MapServer)
layer.

![EA Flood Risk Zones](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image4.png)

Styling the data
----------------

We now have all our data loaded but in order to create a visually
appealing model, it needs to be styled and some additional layers
created.

![All data unstyled in ArcGIS Pro](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image5.png)

Order the layers and implement the relevant settings so they match the
following:

1.  Local Buildings: add a new column to the attribute table and tag
    buildings as High, Medium, Low or Very Low depending on which flood
    risk zone they intersect with. The building colours are adopted from
    the EA flood risk layer with HEX EAE7DD used for any
    non-intersecting buildings -- this value matches the building colour
    from the OS Maps Outdoor theme.

![Building style](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image17.png)

2.  Risk of Flooding from Rivers and Sea: switched off once the above
    intersect is complete.

3.  OS Maps Outdoor: transparency = 30%.

4.  Hillshade: created from the EA Lidar DTM. We used the default
    settings but feel free to experiment. Transparency = 30%.

5.  Slope: created from the EA Lidar DTM. We used the default settings.

6.  EA Lidar DTM: switched off but used as the Ground elevation heights
    in our 3D model.

Your screen should now look similar to this:

![All data styled](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image6.png)

You will probably notice at this point that the OS Maps API will
automatically change depending on your scale. Zoom in and out and move
around your study area to see the changes. In the image below we have
switched off the Local Building layer as this will need to be styled
separately once the 3D model has been created.

![2D close up](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image7.png)

3D Model
--------

It's now time to create the 3D model, which is achieved by going to the `View`
tab, selecting `Convert` and using the `To Local Scene` option. Switch on
the `EA Lidar DTM` layer and drag down from the 2D Layers section to
Elevation Surfaces/Ground and switch off the `WorldElevation3D/Terrain3D`
layer. Like the previous step, zoom in and out and see how the mapbase
automatically changes.

![3D model - image 1](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image8.png)

![3D model - image 2](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image9.png)

![3D model - image 3](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image10.png)

![3D model - image 4](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image11.png)

We also want to see our Local Building layer in 3D and as we themed them
on risk level, the ones effected by flooding should now stand out.
Select the building layer in the Contents menu which will activate the
Feature Layer option tab. Under `Appearance` change the `Type` to `Max Height`
(within the `Extrusion` group). Next to the `Field` option, select the
`Extrusion Expression` option and enter a number in the `Expression` box
e.g. 5.

![3D model - at risk buildings - image 1](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image12.png)

![3D model - at risk buildings - image 2](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image1.png)

![3D model - at risk buildings - image 3](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image15.png)

![3D model - at risk buildings - image 4](/public/os-data-hub-tutorials/dist/gis-applications/3d-flood-modelling/image16.png)

If you create a beautiful 3D model using OS data - let us know!

<em> * The animation featured at the start of the tutorial was exported from Esri ArcGIS Pro (v2.5) which optimises the 3D model as the user navigates around it, meaning it is easier to work with larger and more detailed datasets.  You may notice that the landscape ‘changes’ as more detail is brought into view and the model is rendered for optimum resolution with features further away taking less priority.  The actual outline of the 3D model is directed from using the EA Lidar data which was captured in 2017 and focused on specific areas effected by flooding, hence why the tops of the Mendip Hills have been excluded. </em>  
