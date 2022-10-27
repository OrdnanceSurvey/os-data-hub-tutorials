# Adding overlays

This step-by-step guide will show you how to overlay points, lines and polygons on an OS Maps API backdrop map in OpenLayers.

## Add point, line and polygon overlays

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map#openlayers) example as a template, we can add a point to the map as follows:

```js
const layerPoint = new ol.layer.Vector({
    source: new ol.source.Vector({
        features: [
            new ol.Feature({
                id: 'point',
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
const layerLine = new ol.layer.Vector({
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
const layerPolygon = new ol.layer.Vector({
    source: new ol.source.Vector({
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

This is achieved by adding a `<div>` element to the HTML document:

```html
<div id="popup" class="ol-popup">
    <a href="#" id="popup-closer" class="ol-popup-closer"></a>
    <div id="popup-content"></div>
</div>
```

... along with a `<style>` tag to define the associated style information (CSS) for the element:

```html
<style>
    .ol-popup {
        position: absolute;
        background-color: white;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #ccc;
        bottom: 12px;
        left: -50px;
    }
    .ol-popup:after, .ol-popup:before {
        top: 100%;
        border: solid transparent;
        content: " ";
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
    }
    .ol-popup:after {
        border-top-color: white;
        border-width: 10px;
        left: 48px;
        margin-left: -10px;
    }
    .ol-popup:before {
        border-top-color: #ccc;
        border-width: 11px;
        left: 48px;
        margin-left: -11px;
    }
    .ol-popup-closer {
        text-decoration: none;
        position: absolute;
        top: 2px;
        right: 8px;
        color: #333;
        font-size: smaller;
    }
    .ol-popup-closer:after {
        content: "✖";
    }
    #popup-content {
        font: 12px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif;
        margin-right: 10px;
        max-height: 200px;
        min-width: max-content;
        overflow: auto;
    }
</style>
```

We will then need to include some variables for the elements that make up the popup; an overlay to anchor the popup to the map; and a click handler to hide the popup:

```js
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const overlay = new ol.Overlay({
    element: container,
    autoPan: {
        animation: {
            duration: 250
        }
    }
});
map.addOverlay(overlay);

closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};
```

Note: The popup overlay is added to the map using `map.addOverlay(overlay);`.

The `'singleclick'` event listener is subsequently used to determine if any overlay features exist where the user has clicked on the map &ndash; and if they do, display a popup with the specified HTML content:

```js
map.on('singleclick', function(evt) {
    overlay.setPosition(undefined);
    closer.blur();

    let selectedFeatures = [];

    let feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
        selectedFeatures.push(feature);
    });

    if( selectedFeatures.length > 0 ) {
        content.innerHTML = 'I am a <b>' + selectedFeatures[0].get('id') + '</b>.';
        overlay.setPosition(evt.coordinate);
    }
});
```

That's it! You can access the full version of the source code [here](https://labs.os.uk/public/os-data-hub-tutorials/code-playground/#quick-start-adding-overlays-openlayers).
