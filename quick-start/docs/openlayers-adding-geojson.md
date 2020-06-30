This step-by-step guide will show you how to overlay a GeoJSON file on an OS Maps API backdrop map in OpenLayers.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/quick-start/openlayers-adding-geojson.php"></iframe></p>

## Add GeoJSON features

OpenLayers includes [ol/format/GeoJSON~GeoJSON](https://openlayers.org/en/latest/apidoc/module-ol_format_GeoJSON-GeoJSON.html) for reading and writing data in the GeoJSON format.

The GeoJSON file (called **boundary.geojson**) we are going to overlay is the City of Southampton local authority polygon which has been extracted from the Boundary-Line dataset (and reprojected into WGS84).

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example as a template, we can add the GeoJSON layer to the map as follows:

```js
var geojsonLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'boundary.geojson',
        format: new ol.format.GeoJSON({
            featureProjection: 'EPSG:3857'
        })
    })
});
map.addLayer(geojsonLayer);
```

We can then use the `'once'` event listener to zoom the map to the extent of the polygon once all the data has been loaded into the layer:

```js
geojsonLayer.once("change", e => {
    var extent = geojsonLayer.getSource().getExtent();
    map.getView().fit(extent, { padding: [ 20, 20, 20, 20 ] });
});
```

That's it! You can view the full version [here](/public/os-data-hub-tutorials/dist/quick-start/openlayers-adding-geojson.php).
