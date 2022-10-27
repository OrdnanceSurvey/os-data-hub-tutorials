# Adding overlays

This step-by-step guide will show you how to overlay markers, lines and polygons on an OS Maps API backdrop map in Leaflet.

## Add marker, line and polygon overlays

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map#leaflet) example as a template, we can add a marker to the map as follows:

```js
const marker = L.marker([ 51.5, -0.09 ]).addTo(map);
```

Alternatively, we can create and add a polyline from an array of LatLng points:

```js
const polyline = L.polyline([
    [ 51.503, -0.119 ],
    [ 51.506, -0.111 ],
    [ 51.502, -0.106 ],
    [ 51.506, -0.099 ]
], { color: '#090', weight: 4 }).addTo(map);
```

Creating and adding a polygon from an array of LatLng points is just as easy:

```js
const polygon = L.polygon([
    [ 51.503, -0.071 ],
    [ 51.499, -0.076 ],
    [ 51.495, -0.068 ],
    [ 51.501, -0.061 ],
    [ 51.504, -0.064 ]
], { color: '#c00' }).addTo(map);
```

## Add popups

Once we have added the overlays to the map, we can include some popups to attach information to the newly created objects:

```js
marker.bindPopup("I am a <b>marker<b>.");
polyline.bindPopup("I am a <b>polyline</b>.");
polygon.bindPopup("I am a <b>polygon</b>.");
```

The `bindPopup()` method attaches a popup with the specified HTML content to your overlays. The popups will then appear when you click on each of the objects.

That's it! You can access the full version of the source code [here](https://labs.os.uk/public/os-data-hub-tutorials/code-playground/#quick-start-adding-overlays-leaflet).
