# Adding a GeoJSON file

This step-by-step guide will show you how to overlay a GeoJSON file on an OS Maps API backdrop map in the ArcGIS API for JavaScript.

## Add GeoJSON features

The ArcGIS API for JavaScript [GeoJSONLayer](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-GeoJSONLayer.html) class allows you to add features from a GeoJSON file.

The GeoJSON file (called **boundary.geojson**) we are going to overlay is the City of Southampton local authority polygon which has been extracted from the Boundary-Line dataset (and reprojected into WGS84).

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map#arcgis-javascript-api) example as a template, we can add the GeoJSON layer to the map as follows:

```js
const geojsonLayer = new GeoJSONLayer({
    url: 'boundary.geojson'
});
map.add(geojsonLayer);
```

We can then use the `when()` and `then()` callback functions to zoom the map to the extent of the polygon once all the data has been loaded into the layer:

```js
geojsonLayer
    .when(function() {
        return geojsonLayer.queryExtent();
    })
    .then(function(response) {
        view.goTo(response.extent);
    });
```

That's it! You can access the full version of the source code [here](https://labs.os.uk/public/os-data-hub-tutorials/code-playground/#quick-start-adding-geojson-arcgis-javascript-api).
