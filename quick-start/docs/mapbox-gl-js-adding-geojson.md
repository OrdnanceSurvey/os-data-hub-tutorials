This step-by-step guide will show you how to overlay a GeoJSON file on an OS Maps API backdrop map in Mapbox GL JS.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/quick-start/mapbox-gl-js-adding-geojson.php"></iframe></p>

## Add GeoJSON features

Mapbox GL JS allows GeoJSON sources to be added via a `'data'` property, whose value can be a URL or inline GeoJSON.

The GeoJSON file we are going to overlay is the City of Southampton local authority polygon which has been extracted from the Boundary-Line dataset (and reprojected into WGS84).

Using the [Display a basic ZXY map (EPSG:3857)](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map) example a template, the first step is to add a `'load'` event to the map:

```js
map.on('load', function() {
});
```

The is event is fired immediately after all necessary resources have been downloaded and the first visually complete rendering of the map has occurred.

We can then add the **boundary.geojson** file as a source to the map's style:

```js
map.on('load', function() {
    map.addSource('boundary', {
        'type': 'geojson',
        'data': 'boundary.geojson'
    });
);
```

Once the source has been added, we can add a layer to the map's style. This defines how data from a specified source will be styled:

```js
map.on('load', function() {
    ...
    map.addLayer({
        'id': 'boundary',
        'type': 'fill',
        'source': 'boundary',
        'layout': {},
        'paint': {
            'fill-color': '#38f',
            'fill-opacity': 0.2
        }
    });
);
```

In this instance we have added a polygon (`'type': 'fill'`) with the appropriate paint properties.

By default, Mapbox GL JS will add a thin outline to any added polygon layers. If we want to include a styled outline, we can to add another layer using exactly the same source &ndash; but this time rendering it as a line (`'type': 'line'`):

```js
map.on('load', function() {
    ...
    map.addLayer({
        'id': 'boundary-outline',
        'type': 'line',
        'source': 'boundary',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#38f',
            'line-width': 2
        }
    });
});
```

The downside to the above approach is that the GeoJSON data is only stored on the Web Worker side &ndash; meaning there is no way to actually reference the raw source.

Being able to reference the source data can be useful for a variety of cases; including the ability to zoom to the extent of the features.

The process is very similar to that which has been described above &ndash; we just need to use the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to make the request for the **boundary.geojson** file &ndash; and treat the response as inline GeoJSON:

```js
map.on('load', function() {
    fetch('boundary.geojson')
        .then(response => response.json())
        .then((data) => {
            map.addSource('boundary', {
                'type': 'geojson',
                'data': data
            });

            map.addLayer({
                'id': 'boundary',
                'type': 'fill',
                'source': 'boundary',
                'layout': {},
                'paint': {
                    'fill-color': '#38f',
                    'fill-opacity': 0.2
                }
            });
            map.addLayer({
                'id': 'boundary-outline',
                'type': 'line',
                'source': 'boundary',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#38f',
                    'line-width': 2
                }
            });
        })
        .catch(err => console.error(err));
});
```

Because we now have access to the GeoJSON data source as a variable, we can use it to fit the map bounds to the extent of the contained features:

```js
map.on('load', function() {
    fetch('boundary.geojson')
        .then(response => response.json())
        .then((data) => {
            ...
            var bounds = geojsonExtent(data);
            map.fitBounds(bounds, {
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

That's it! You can view the full version [here](/public/os-data-hub-tutorials/dist/quick-start/mapbox-gl-js-adding-geojson.php).
