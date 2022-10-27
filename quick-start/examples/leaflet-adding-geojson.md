# Adding a GeoJSON file

This step-by-step guide will show you how to overlay a GeoJSON file on an OS Maps API backdrop map in Leaflet.

## Add GeoJSON features

Leaflet supports the GeoJSON format by default. However we are going to use [leaflet-omnivore](https://github.com/mapbox/leaflet-omnivore) (a universal format parser) which includes a AJAX library (called [corslite](https://github.com/mapbox/corslite)) to enable us to load the file from a URL; before parsing the GeoJSON, and returning the layer.

The GeoJSON file we are going to overlay is the City of Southampton local authority polygon which has been extracted from the Boundary-Line dataset (and reprojected into WGS84).

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map#leaflet) example as a template, the first thing we need to do is add the **leaflet-omnivore** JavaScript file after the existing script tags:

```html
<script src="https://cdn.jsdelivr.net/npm/@mapbox/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js"></script>
```

Once the script has been included, the boundary polygon layer can be added to the map:

```js
const geojsonLayer = omnivore.geojson('boundary.geojson')
    .on('ready', function() {
        map.fitBounds(geojsonLayer.getBounds());
    })
    .addTo(map);
```

You will notice that the parser uses the on `'ready'` fire event to zoom the map to the extent of the polygon once all data has been loaded into the layer.

That's it! You can access the full version of the source code [here](https://labs.os.uk/public/os-data-hub-tutorials/code-playground/#quick-start-adding-geojson-leaflet).
