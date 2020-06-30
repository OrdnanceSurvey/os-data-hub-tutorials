This step-by-step guide will show you how to overlay a GPX file on an OS Maps API backdrop map in Leaflet.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/quick-start/leaflet-adding-gpx.php"></iframe></p>

## Add GPX route

In order to add the GPX file we are going to make use of [leaflet-omnivore](https://github.com/mapbox/leaflet-omnivore) (a universal format parser) &ndash; includes a AJAX library (called [corslite](https://github.com/mapbox/corslite)) which enables us to load the file from a URL; as well as a dependency (called [toGeoJSON](https://github.com/mapbox/togeojson)) to convert the GPX to GeoJSON (a format which Leaflet supports default).

The GPX file (called **route.gpx**) we are going to overlay represents a local running route near the Ordnance Survey head office in Southampton.

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example as a template, the first thing we need to do is add the **leaflet-omnivore** JavaScript file after the existing script tags:

```html
<script src="https://api.tiles.mapbox.com/mapbox.js/plugins/leaflet-omnivore/v0.3.1/leaflet-omnivore.min.js"></script>
```
Once the script has been included, the GPX route layer (with a custom style) can be added to the map:

```js
var customLayer = L.geoJson(null, {
    style: function(feature) {
        return { color: '#d20e58', weight: 4, opacity: 0.8 };
    }
});

var gpxLayer = omnivore.gpx('route.gpx', null, customLayer)
    .on('ready', function() {
        map.fitBounds(gpxLayer.getBounds());
    })
    .addTo(map);
```

You will notice that the parser uses the on `'ready'` fire event to zoom the map to the extent of the route once all data has been loaded into the layer.

## Add start + end points

In order to give some context to the route, you might like to add a start marker [green icon] and end marker [red icon] as additional overlays to the map...

To achieve this, we can add some additional lines of code to the `'ready'` fire event &ndash; before the `map.fitBounds(gpxLayer.getBounds());` method is called.

We will also need a couple of new JavaScript helper functions (which can be included anywhere in the script):

```js
/**
 * Returns a LatLng array from a position.
 */
function getLatLng(pnt) {
    return pnt.slice(0, 2).reverse();
}

/**
 * Returns a custom icon to provide when creating a marker.
 * Reference: https://github.com/pointhi/leaflet-color-markers
 */
function getIcon(color) {
    return new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + color + '.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [ 25, 41 ],
        iconAnchor: [ 12, 41 ],
        popupAnchor: [ 1, -34 ],
        shadowSize: [ 41, 41 ]
    });
}
```

First off, we define a variable called *coordinates* using the `toGeoJSON()` method to return a GeoJSON representation of the route (as a GeoJSON LineString Feature):

```js
var coordinates = gpxLayer.toGeoJSON().features[0].geometry.coordinates;
```

Because the GeoJSON LineString Feature is just an array of positions &ndash; we can then take the first value from the list to create and add a marker for the start point of the route:

```js
var startPoint = getLatLng(coordinates[0]);
var startIcon = getIcon('green');
var startMarker = L.marker(startPoint, { icon: startIcon }).addTo(map);
```

The same can then be achieved for end point of the route (by taking the last value from the list of positions):

```js
var endPoint = getLatLng(coordinates[ coordinates.length-1 ]);
var endIcon = getIcon('red');
var endMarker = L.marker(endPoint, { icon: endIcon }).addTo(map);
```

NOTE: The start and end coordinates are passed to the `getLatLng()` function to ensure that the value only contains a latitude and longitude [in that order]. It is possible that the position might include elevation as an optional third value &ndash; which is unsupported when creating a Leaflet marker icon.

That's it! You can view the full version [here](/public/os-data-hub-tutorials/dist/quick-start/leaflet-adding-gpx.php).
