This step-by-step guide will show you how to overlay a GPX file on an OS Maps API backdrop map in OpenLayers.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/quick-start/openlayers-adding-gpx.php"></iframe></p>

## Add GPX route

OpenLayers includes [`ol/format/GPX~GPX`](https://openlayers.org/en/latest/apidoc/module-ol_format_GPX-GPX.html) for reading and writing data in the GPX format.

The GPX file (called **route.gpx**) we are going to overlay represents a local running route near the Ordnance Survey head office in Southampton.

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example as a template, we can add the GPX route layer to the map as follows:

```js
var gpxLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
        url: 'route.gpx',
        format: new ol.format.GPX()
    }),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(210, 14, 88, 0.8)',
            width: 4
        })
    })
});
map.addLayer(gpxLayer);
```

We can then use the `'once'` event listener to zoom the map to the extent of the route once all the data has been loaded into the layer:

```js
gpxLayer.once("change", e => {
    var extent = gpxLayer.getSource().getExtent();
    map.getView().fit(extent, { maxZoom: 14 });
});
```

## Add start + end points

In order to give some context to the route, you might like to add a start marker [green icon] and end marker [red icon] as additional overlays to the map...

To achieve this, we can add some additional lines of code to the `'once'` event listener &ndash; before the zoom to extent method is called.

First off, we define a variable called *coordinates* whose value is an array of the positions which define the route feature:

```js
var coordinates = gpxLayer.getSource().getFeatures()[0].values_.geometry.getCoordinates()[0];
```

With this array of positions &ndash; we can then take the first and last values from the list to create a couple of point geometry features. These are added to the map through a new vector layer and source definition:

```js
var startCoord = coordinates[0],
    endCoord = coordinates[coordinates.length-1];

var layerPoints = new ol.layer.Vector({
    source: new ol.source.Vector({
        features: [
            new ol.Feature({
                id: 'start-point',
                fill: '#00b200',
                geometry: new ol.geom.Point(startCoord)
            }),
            new ol.Feature({
                id: 'end-point',
                fill: '#ff0000',
                geometry: new ol.geom.Point(endCoord)
            })
        ]
    }),
    style: selectStyle
});
map.addLayer(layerPoints);
```

In this instance the styling is returned from a function called `selectStyle` (whose purpose is to take the colour hex value which have been defined as a feature attribute and return a data-driven style object):

```js
/**
 * Returns data-driven style object (based on the feature 'fill' attribute).
 */
function selectStyle(feature) {
    var style = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({
                color: feature.get('fill')
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 3
            })
        })
    });
    return style;
}
```

That's it! You can view the full version [here](/public/os-data-hub-tutorials/dist/quick-start/openlayers-adding-gpx.php).
