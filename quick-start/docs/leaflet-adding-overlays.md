This step-by-step guide will show you how to overlay markers, lines and polygons on an OS Maps API backdrop map in Leaflet.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/quick-start/leaflet-adding-overlays.php"></iframe></p>

## Add marker, line and polygon overlays

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example as a template, we can add a marker to the map as follows:

```js
var marker = L.marker([ 51.5, -0.09 ]).addTo(map);
```

Alternatively, we can create and add a polyline from an array of LatLng points:

```js
var polyline = L.polyline([
    [ 51.503, -0.119 ],
    [ 51.506, -0.111 ],
    [ 51.502, -0.106 ],
    [ 51.506, -0.099 ]
], { color: '#090', weight: 4 }).addTo(map);
```

Creating and adding a polygon from an array of LatLng points is just as easy:

```js
var polygon = L.polygon([
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

That's it! You can view the full version [here](/public/os-data-hub-tutorials/dist/quick-start/leaflet-adding-overlays.php).
