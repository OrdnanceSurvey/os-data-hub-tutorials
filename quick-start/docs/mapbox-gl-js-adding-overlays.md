This step-by-step guide will show you how to overlay points, lines and polygons on an OS Maps API backdrop map in Mapbox GL JS.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/quick-start/mapbox-gl-js-adding-overlays.php"></iframe></p>

## Add point, line and polygon overlays

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example as a template, the first step is to add a `'load'` event to the map:

```js
map.on('load', function() {
});
```

This event is fired immediately after all necessary resources have been downloaded and the first visually complete rendering of the map has occurred.

The point, line and polygon overlays can be added by defining a [GeoJSON](https://geojson.org/) FeatureCollection &ndash; and then adding it as a source layer to the map's style:

```js
map.on('load', function() {
    map.addSource('geojson', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [ -0.09, 51.5 ]
                    }
                },
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': [
                            [ -0.119, 51.503 ],
                            [ -0.111, 51.506 ],
                            [ -0.106, 51.502 ],
                            [ -0.099, 51.506 ]
                        ]
                    }
                },
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [
                            [
                                [ -0.071, 51.503 ],
                                [ -0.076, 51.499 ],
                                [ -0.068, 51.495 ],
                                [ -0.061, 51.501 ],
                                [ -0.064, 51.504 ],
                                [ -0.071, 51.503 ]
                            ]
                        ]
                    }
                }
            ]
        }
    });
});
```

The various geometry types can then be added a styled layers by filtering the appropriate features from the FeatureCollection.

Points are added as follows: 

```js
map.on('load', function() {
    ...
    map.addLayer({
        'id': 'point',
        'type': 'circle',
        'source': 'geojson',
        'layout': {},
        'paint': {
            'circle-radius': 7,
            'circle-color': '#38f',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 3
        },
        'filter': ['==', '$type', 'Point']
    });
});
```

Lines are added as follows:

```js
map.on('load', function() {
    ...
    map.addLayer({
        'id': 'polyline',
        'type': 'line',
        'source': 'geojson',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#090',
            'line-width': 4
        },
        'filter': ['==', '$type', 'LineString']
    });
});
```

Polygons are added as follows:

```js
map.on('load', function() {
    ...
    map.addLayer({
        'id': 'polygon',
        'type': 'fill',
        'source': 'geojson',
        'layout': {
        },
        'paint': {
            'fill-color': '#c00',
            'fill-opacity': 0.2
        },
        'filter': ['==', '$type', 'Polygon']
    });
    map.addLayer({
        'id': 'polygon-outline',
        'type': 'line',
        'source': 'geojson',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#c00',
            'line-width': 3
        },
        'filter': ['==', '$type', 'Polygon']
    });
});
```

By default, Mapbox GL JS will add a thin outline to any added polygon layers. If we want to include a styled outline, we need to add another layer using exactly the same filtered source &ndash; but this time rendering it with the `'type'` property specified as *line*.

## Add popups

Once we have added the overlays to the map &ndash; we can include some popups to attach information to the newly created objects:

```js
map.on('load', function() {
    ...
    var qryLayers = [ 'point', 'polyline', 'polygon' ];

    map.on('click', function(e) {
        var bbox = [
            [ e.point.x - 5, e.point.y - 5 ],
            [ e.point.x + 5, e.point.y + 5 ]
        ];

        var features = map.queryRenderedFeatures(bbox, { layers: qryLayers });

        if(! features.length )
            return;

        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML('I am a <b>' + features[0].layer.id + '</b>.')
            .addTo(map);
    });

    map.on('mousemove', function(e) {
        var features = map.queryRenderedFeatures(e.point, { layers: qryLayers });
        map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    });
});
```

Here we define an array of the layers for which we want to include the popups.

When a `'click'` event occurs on a feature in any of the queryable layers &ndash; we use the  [`queryRenderedFeatures`](https://docs.mapbox.com/mapbox-gl-js/api/#map#queryrenderedfeatures) method to show properties of clicked map elements.

This method takes a geometry (which in this case is a *5px* bounding box encompassing the clicked point) and the array of layer IDs &ndash; and returns an array of GeoJSON Feature objects representing visible features that satisfy the query parameters.

We also use a `'mousemove'` event (in conjunction with the `queryRenderedFeatures` method) to change the cursor to a pointer when the mouse is over one of the queryable layers.

## Add markers

As an alternative to adding styled point features to the map (via GeoJSON) &ndash; we can use the following syntax to add a marker:

```js
var marker = new mapboxgl.Marker({ color: '#38f' })
    .setLngLat([ -0.09, 51.5 ])
    .addTo(map);
```

In a similar manner to the overlay features &ndash; we can attach a popup to the marker as follows:

```js
var popup = new mapboxgl.Popup({ offset: 25 }).setHTML('I am a <b>marker</b>.');
marker.setPopup(popup);
```

That's it! You can view the full version [here](/public/os-data-hub-tutorials/dist/quick-start/mapbox-gl-js-adding-overlays.php).
