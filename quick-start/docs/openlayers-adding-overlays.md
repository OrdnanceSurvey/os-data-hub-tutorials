This step-by-step guide will show you how to overlay points, lines and polygons on an OS Maps API backdrop map in OpenLayers.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/quick-start/openlayers-adding-overlays.php"></iframe></p>

## Add point, line and polygon overlays

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example as a template, we can add a point to the map as follows:

```js
var layerPoint = new ol.layer.Vector({
    source: new ol.source.Vector({
        features: [
            id: 'point',
            new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat([ -0.09, 51.5 ]))
            })
        ]
    }),
    style: new ol.style.Style({
        image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({
                color: '#38f'
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 3
            })
        })
    })
});
map.addLayer(layerPoint);
```

Here we are defining a new vector layer and source. We are then creating a new Point geometry feature from a projected LonLat coordinate array. A style function is also used to render the feature accordingly.

Alternatively, we can create and add a LineString from an array of points:

```js
var layerLine = new ol.layer.Vector({
    source: new ol.source.Vector({
        features: [
            new ol.Feature({
                id: 'line',
                geometry: new ol.geom.LineString([
                    [ -0.119, 51.503 ],
                    [ -0.111, 51.506 ],
                    [ -0.106, 51.502 ],
                    [ -0.099, 51.506 ]
                ]).transform('EPSG:4326', 'EPSG:3857')
            })
        ]
    }),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#090',
            width: 4
        })
    })
});
map.addLayer(layerLine);
```

Creating and adding a Polygon from an array of points is just as easy:

```js
var layerPolygon = new ol.layer.Vector({
    source: new ol.source.Vector({
    id: 'polygon',
        features: [
            new ol.Feature({
                id: 'polygon',
                geometry: new ol.geom.Polygon([
                    [
                        [ -0.071, 51.503 ],
                        [ -0.076, 51.499 ],
                        [ -0.068, 51.495 ],
                        [ -0.061, 51.501 ],
                        [ -0.064, 51.504 ]
                    ]
                ]).transform('EPSG:4326', 'EPSG:3857')
            })
        ]
    }),
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#c00',
            width: 3
        }),
        fill: new ol.style.Fill({
          color: 'rgba(204, 0, 0, 0.2)'
        })
    })
});
map.addLayer(layerPolygon);
```

## Add popups

Once we have added the overlays to the map &ndash; we can include some popups to show information for the newly created features.

Although it possible to define your own popups, we are going to make use the following [Github repo](https://github.com/walkermatt/ol-popup) which provides a basic functionality out-of-the-box.

To use this library you will need to add the **ol-popup** CSS file to the header of your HTML document: 

```html
<link rel="stylesheet" href="https://unpkg.com/ol-popup@4.0.0/src/ol-popup.css" />
```

... and the **ol-popup** JavaScript file after the existing script tags:

```html
<script src="https://unpkg.com/ol-popup@4.0.0"></script>
```

We can then define a new popup at the bottom of our script, and add it as an overlay to the map:

```js
var popup = new Popup();
map.addOverlay(popup);
```

The `'singleclick'` event listener is subsequently used to determine if any overlay features exist where the user has clicked on the map &ndash; and if they do, display a popup with the specified HTML content:

```js
map.on('singleclick', function(evt) {
    popup.hide();

    var selectedFeatures = [];

    var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
        selectedFeatures.push(feature);
    });

    if( selectedFeatures.length > 0 ) {
        var content = 'I am a <b>' + selectedFeatures[0].get('id') + '</b>.';
        popup.show(evt.coordinate, content);
    }
});
```

That's it! You can view the full version [here](/public/os-data-hub-tutorials/dist/quick-start/openlayers-adding-overlays.php).
