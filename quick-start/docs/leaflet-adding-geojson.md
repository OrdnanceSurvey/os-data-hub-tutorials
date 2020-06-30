This step-by-step guide will show you how to overlay a GeoJSON file on an OS Maps API backdrop map in Leaflet.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/quick-start/leaflet-adding-geojson.php"></iframe></p>

## Add GeoJSON features

Leaflet supports the GeoJSON format by default. However we are going to use [leaflet-omnivore](https://github.com/mapbox/leaflet-omnivore) (a universal format parser) which includes a AJAX library (called [corslite](https://github.com/mapbox/corslite)) to enable us to load the file from a URL; before parsing the GeoJSON, and returning the layer.

The GeoJSON file we are going to overlay is the City of Southampton local authority polygon which has been extracted from the Boundary-Line dataset (and reprojected into WGS84).

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example as a template, the first thing we need to do is add the **leaflet-omnivore** JavaScript file after the existing script tags:

```html
<script src="https://api.tiles.mapbox.com/mapbox.js/plugins/leaflet-omnivore/v0.3.1/leaflet-omnivore.min.js"></script>
```

Once the script has been included, the boundary polygon layer can be added to the map:

```js
var geojsonLayer = omnivore.geojson('boundary.geojson')
    .on('ready', function() {
        map.fitBounds(geojsonLayer.getBounds());
    })
    .addTo(map);
```

You will notice that the parser uses the on `'ready'` fire event to zoom the map to the extent of the polygon once all data has been loaded into the layer.

That's it! You can view the full version [here](/public/os-data-hub-tutorials/dist/quick-start/leaflet-adding-geojson.php).
