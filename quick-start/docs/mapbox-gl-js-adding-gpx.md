This step-by-step guide will show you how to overlay a GPX file on an OS Maps API backdrop map in Mapbox GL JS.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="https://labs.os.uk/public/os-data-hub-tutorials/dist/quick-start/mapbox-gl-js-adding-gpx.php?auth=" title="Adding GPX"></iframe></p>

## Add GPX route

In order to add the GPX file we are going to make use of [toGeoJSON](https://github.com/mapbox/togeojson) to convert the GPX document to GeoJSON.

Mapbox GL JS allows GeoJSON sources to be added via a `'data'` property, whose value can be a URL or inline GeoJSON (which in this case will be a JavaScript object).

The GPX file (called **route.gpx**) we are going to overlay represents a local running route near the Ordnance Survey head office in Southampton.

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example as a template, the first thing we need to do is add the **toGeoJSON** JavaScript file after the existing script tags:

```html
<script src="https://cdn.jsdelivr.net/npm/@mapbox/togeojson@0.16.0/togeojson.min.js"></script>
```
Once the script has been included, we can add a `'load'` event to the map:

```js
map.on('load', function() {
});
```

The is event is fired immediately after all necessary resources have been downloaded and the first visually complete rendering of the map has occurred.

We can then add the GPX route using the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to make the request for the **route.gpx** file.

The `doc` argument for the `toGeoJSON.gpx()` function call must be a GPX document as an XML DOM object (not as a string). The `DOMParser.parseFromString()` method is therefore used to parse the response text string accordingly:

```js
map.on('load', function() {
    fetch('route.gpx')
        .then(response => response.text())
        .then(str => new DOMParser().parseFromString(str, "text/xml"))
        .then(doc => {
            data = toGeoJSON.gpx(doc);
        });
});
```

Once the GPX has been converted to a JavaScript object of GeoJSON data &ndash; it can be added as a layer to the map's style:

```js
map.on('load', function() {
    fetch('route.gpx')
        .then(response => response.text())
        .then(str => new DOMParser().parseFromString(str, "text/xml"))
        .then(doc => {
            ...
            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': {
                    'type': 'geojson',
                    'data': data
                },
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#d20e58',
                    'line-width': 4,
                    'line-opacity': 0.8
                }
            });
        });
});
```

The JavaScript object of GeoJSON data can also be used to fit the map bounds to the extent of the contained features:

```js
map.on('load', function() {
    fetch('route.gpx')
        .then(response => response.text())
        .then(str => new DOMParser().parseFromString(str, "text/xml"))
        .then(doc => {
            ...
            var bounds = geojsonExtent(data);
            map.fitBounds(bounds, {
                maxZoom: 13,
                padding: 20,
                animate: false
            });
        })
        .catch(err => console.error(err));
});
```

NOTE: The `geojsonExtent()` function uses [geojson-extent](https://github.com/mapbox/geojson-extent) to compute an extent given a GeoJSON object.

In order to access this function it will be necessary to add the geojson-extent JavaScript file after the existing script tags (at the top of your HTML document):

```html
<script src="https://api.mapbox.com/mapbox.js/plugins/geojson-extent/v0.0.1/geojson-extent.js"></script>
```

## Add start + end points

In order to give some more context, you might like to incorporate a marker icon to represent the starting point [green icon] and finish/end point [red icon] of the route...

To achieve this, we can add some additional lines of code to the `'load'` event &ndash; before the `map.fitBounds();` method is called.

First off, we define a variable called *coordinates* whose value is an array of the positions which define the route feature:

```js
var coordinates = data.features[0].geometry.coordinates;
```

Because the GeoJSON LineString Feature is just an array of positions &ndash; we can then take the first value from the list to create and add a marker for the start point of the route:

```js
var startMarker = new mapboxgl.Marker({ color: '#00b200' })
    .setLngLat(coordinates[0])
    .addTo(map);
```

The same can then be achieved for end point of the route (by taking the last value from the list of positions):

```js
var endMarker = new mapboxgl.Marker({ color: '#ff0000' })
    .setLngLat(coordinates[ coordinates.length-1 ])
    .addTo(map);
```

That's it! You can access the full version [here](https://labs.os.uk/public/os-data-hub-tutorials/dist/quick-start/mapbox-gl-js-adding-gpx.php?auth=) (or view the [source code](https://labs.os.uk/public/os-data-hub-tutorials/dist/quick-start/source-view.html#mapbox-gl-js-adding-gpx) if you prefer).
