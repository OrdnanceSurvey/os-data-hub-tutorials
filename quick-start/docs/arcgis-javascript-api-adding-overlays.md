This step-by-step guide will show you how to overlay points, lines and polygons on an OS Maps API backdrop map in the ArcGIS API for JavaScript.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/quick-start/arcgis-javascript-api-adding-overlays.php"></iframe></p>

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example as a template, we can add a point to the map as follows:

```js
var pointGraphic = new Graphic({
    geometry: {
        type: "point",
        longitude: -0.09,
        latitude: 51.5
    },
    symbol: {
        type: "simple-marker",
        color: [ 51, 136, 255 ],
        outline: {
            color: [ 255, 255, 255 ],
            width: 2
        }
    }
});
view.graphics.add(pointGraphic);
```

Here we are creating a point graphic with some property definitions for the geometry and symbology. We then add the point to the default graphics property on the map view.

Alternatively, we can create and add a polyline from an array of coordinates:

```js
var polylineGraphic = new Graphic({
    geometry: {
        type: "polyline",
        paths: [
            [ -0.119, 51.503 ],
            [ -0.111, 51.506 ],
            [ -0.106, 51.502 ],
            [ -0.099, 51.506 ]
        ]
    },
    symbol: {
        type: "simple-line",
        color: [ 0, 153, 0 ],
        width: 3
    }
});
view.graphics.add(polylineGraphic);
```

Creating and adding a polygon from an array of coordinates is just as easy:

```js
var polygonGraphic = new Graphic({
    geometry: {
        type: "polygon",
        rings: [
            [ -0.071, 51.503 ],
            [ -0.076, 51.499 ],
            [ -0.068, 51.495 ],
            [ -0.061, 51.501 ],
            [ -0.064, 51.504 ]
        ]
    },
    symbol: {
        type: "simple-fill",
        color: [ 204, 0, 0, 0.2 ],
        outline: {
            color: [ 204, 0, 0 ],
            width: 2
        }
    },
    popupTemplate: {
        content: "I am a <b>polygon</b>."
    }
});
view.graphics.add(polygonGraphic);
```

## Add popups

Popups can give users access to all the attributes in a graphic. Setting a simple [PopupTemplate](https://developers.arcgis.com/javascript/latest/api-reference/esri-PopupTemplate.html) will allow users to see the attributes of the feature (or some basic HTML content) when it is clicked in the view.

NOTE: This step must either be done in the constructor for the graphic or prior to adding the graphic to the map view:

```js
var pointGraphic = new Graphic({
    geometry: {
        type: "point",
        longitude: -0.09,
        latitude: 51.5
    },
    symbol: {
        type: "simple-marker",
        color: [ 51, 136, 255 ],
        outline: {
            color: [ 255, 255, 255 ],
            width: 2
        }
    },
    popupTemplate: {
        content: "I am a <b>point</b>."
    }
});
view.graphics.add(pointGraphic);
```

That's it! You can view the full version [here](/public/os-data-hub-tutorials/dist/quick-start/arcgis-javascript-api-adding-overlays.php).
