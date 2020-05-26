
Maps that update based on user interaction can be incredibly useful. The Find My Nearest web app showcases a few APIs and web mapping capabilities of the OS Data Hub APIs. 

The webpage lets users select a location on a map, a feature type to visualize, then shows features of those type near their selected location. 

<iframe src="/public/os-data-hub-tutorials/dist/web-development/find-my-nearest/" height="600" width="800" style="border:1px solid #eee"></iframe>

This tutorial will show how we used *[Leaflet](https://leafletjs.com/)*, *[Turf.js](https://osdatahub.os.uk)*  and the *[OS Maps](https://osdatahub.os.uk/docs/wmts/overview)* and *[OS Features](https://osdatahub.os.uk/docs/wfs/overview)* APIs to create an interactive web map. We'll only focus on key functionality here, but all code can be reviewed on Github.

## Configuring the OS Maps API

The Find My Nearest interface shows a large interactive map, created using Leaflet.

Leaflet works by connecting to the OS Maps API, which is a [web map tile service](https://www.ogc.org/standards/wmts). As the user pans and zooms on the map, the browser fetches and renders .png images in the appropriate position. The library provides a large suite of methods enabling interaction and visualization, detailed in the documentation. 

### Sample raster tile, or image with tiles outlined.

When the Leaflet library is imported, a global `L` object is declared. When we instantiate a new `L.map` object we provide the ID of a DOM `<div>` element, as well as a `mapOptions` object specifying where to set the initial view. We also add controls to the map. 

```javascript
var mapOptions = {
    minZoom: 7,
    maxZoom: 20,
    center: [ 51.502, -0.126 ],
    zoom: 14,
    attributionControl: false,
    zoomControl: false
};

var map = new L.map('map', mapOptions); 
            /*      'map' is the id of the 
                    <div> in the HTML document  */

var ctrlScale = L.control.scale({ position: 'bottomright' }).addTo(map);

```

This alone does not give the browser any map data to visualize, though. For that we need create a new `L.tileLayer` object, connect it to the OS Maps API, and add it to the map. (Note: an API key is needed, which you can get at [osdatahub.os.uk](https://osdatahub.os.uk).)

```javascript
// Set API key
const apiKey = "API_KEY_HERE";

// Define URLs of API endpoints
var wmtsServiceUrl = 'https://osdatahubapi.os.uk/OSMapsAPI/wmts/v1';
wfsServiceUrl = 'https://osdatahubapi.os.uk/OSFeaturesAPI/wfs/v1';

// Load and display WMTS tile layer on the map.

var basemap = L.tileLayer(
        wmtsServiceUrl + "?" + basemapQueryString, 
        { maxZoom: 20 }
    ).addTo(map);
```

With that we've created a Leaflet map and connected to the OS Maps API. The result: a pannable, zoomable map that shows the right level of detail for the zoom level. 🗺️

## Querying the OS Features API

The next sections will show how to query the OS Features API based on a location selected by the user. 

### Selecting a location to query

The webpage is designed to let users find their nearest features - but nearest to what? On the page, users have the option to select a location on the map or let the browser detect their location using their IP address. If they don't do either we automatically find features nearest the center of the map when the request is generated.

To do this, we write code for each option, and attach event handlers to the buttons displayed in the lefthand panel. 

First, when they click "Select on map.", users are able to click a location within the map div. The click event object is passed into the function - when a `L.map` object is clicked, _the coordinates of the point clicked are included in the event object_, as the `latlng` property. We parse these and convert them into an array, `[lng, lat]`, and call `updateCoordsToFind()`

```javascript
function selectLocationOnMap(event) {
    // On click return location, set to coordsToFind

    var coord = event.latlng.toString().split(',');
    var lat = coord[0].split('(');
    var lng = coord[1].split(')');

    let coords = [Number(lng[0]), Number(lat[1])];

    updateCoordsToFind(coords);

}
```

(Note: a special thanks for  [@ramiroaznar](http://bl.ocks.org/ramiroaznar/2c2793c5b3953ea68e8dd26273f5b93c) for providing the reference code for this function.)

The `updateCoordsToFind()` function sets a global variable to the `coords` parameter passed in, clears the map of existing markers and adds a new Leaflet marker to the map at that location. Then it flies to the location so the user can see where they're going to search. 

```javascript
function updateCoordsToFind(coords) {

    coordsToFind = coords;
        // ^^ declared globally 

    coordsToFindGroup.clearLayers();
    L.marker(coords.reverse())
        .addTo(coordsToFindGroup);
    
    map.flyTo(coordsToFind)

}
```

We also let users request results from the approximate location of their IP address, based on some cool code written by [Adeyinka Adegbenro](https://medium.com/better-programming/how-to-detect-the-location-of-your-websites-visitor-using-javascript-92f9e91c095f), though we won't get into how it works here. 

### Querying the OS Features API

The OS Features API serves vector features from Ordnance Survey's huge dataset that match query parameters. To find features near the point queried, we take a few sequential steps:
1. Build a query based on user inputs. 
2. Fetch results based on the query parameters.
3. Find the features nearest the selected point within the array of result features.
4. Add nearest features to the map and sidebar.

Let's look at each of these in order. 

#### Building a query

The user is required to input the type of features to find and the location they want to search. With this information, we dynamically build a request for the OS Features API. 

This is done by using [Turf.js](https://osdatahub.os.uk) to create a 1km buffer polygon around the point to search. This polygon is used to construct an XML filter based on the Open Geospatial Consortium (OGC) standard, which is included in the HTTP GET request to the OS Features API. The server performs a spatial query and returns a GeoJSON FeatureCollection with an array of polygons intersecting that polygon. We'll also define an object literal (`wfsParams`) containing parameters that we'll encode into the URL, which we'll use to request data. 

Let's look at the code. 

```javascript

// First we pull the types of features to query from the dropdown input element
let featureTypeToFind = $('#feature-type-select span').text();
let typeName = getFeatureTypeToFind(featureTypeToFind);
    /*      ^^ This function just returns the Features API-compliant string to search        
            based on the natural language string the user selected */

// {Turf.js} Takes the centre point coordinates and calculates a circular polygon
// of the given a radius in kilometers; and steps for precision. Returns GeoJSON Feature object.
var circle = turf.circle(coordsToFind, 1, { steps: 24, units: 'kilometers' });

// Get the circle geometry coordinates and return a new space-delimited string - required based on the OGC standard.
var coords = circle.geometry.coordinates[0].join(' ');

// Create an OGC XML filter parameter value which will select the
// features intersecting the circle polygon coordinates.
var xml = '<ogc:Filter>';
xml += '<ogc:Intersects>';
xml += '<ogc:PropertyName>SHAPE</ogc:PropertyName>';
xml += '<gml:Polygon srsName="urn:ogc:def:crs:EPSG::4326">';
xml += '<gml:outerBoundaryIs>';
xml += '<gml:LinearRing>';
xml += '<gml:coordinates>' + coords + '</gml:coordinates>';
xml += '</gml:LinearRing>';
xml += '</gml:outerBoundaryIs>';
xml += '</gml:Polygon>';
xml += '</ogc:Intersects>';
xml += '</ogc:Filter>';

let wfsParams = {
        key: apiKey,
        service: 'WFS',
        request: 'GetFeature',
        version: '2.0.0',
        typeNames: typeName,
        outputFormat: 'GEOJSON',
        srsName: 'urn:ogc:def:crs:EPSG::4326',
        filter: xml,
        count: 100,
        startIndex: 0
    };
```

Now the `xml` variable holds a string that we can pass to the API as a filter.  Ultimately the service URL, API key and query parameters are all combined into a single URL, which is then sent to the Features API using a GET request.

First, the function that constructs a URL:

```javascript

/**
 * Return URL with encoded parameters.
 * @param {object} params - The parameters object to be encoded.
 */
function getUrl(params) {
    var encodedParameters = Object.keys(params)
        .map(paramName => paramName + '=' + encodeURI(params[paramName]))
        .join('&');

    return wfsServiceUrl + '?' + encodedParameters;
}
// An example output of this function call would be:
// https://osdatahubapi.os.uk/OSFeaturesAPI/wfs/v1?key=INSERT_API_KEY&service=WFS&request=GetFeature&version=2.0.0&typeNames=Zoomstack_Greenspace&outputFormat=GEOJSON&srsName=urn:ogc:def:crs:EPSG::4326&filter=%3Cogc:Filter%3E%3Cogc:Intersects%3E%3Cogc:PropertyName%3ESHAPE%3C/ogc:PropertyName%3E%3Cgml:Polygon%20srsName=%22urn:ogc:def:crs:EPSG::4326%22%3E%3Cgml:outerBoundaryIs%3E%3Cgml:LinearRing%3E%3Cgml:coordinates%3E-0.136771,51.51367520363725%20-0.1405111456338577,51.513368708192694%20-0.14399626401253374,51.51247012090285%20-0.14698874577786938,51.51104071147652%20-0.149284620111411,51.50917793615162%20-0.15072746521541214,51.507008784324505%20-0.15121905792711335,51.50468111255005%20-0.15072603948008415,51.50235355967132%20-0.14928215066533848,51.500184732673425%20-0.1469858943070869,51.4983224010735%20-0.14399379456633463,51.49689343537215%20-0.1405097198984031,51.49599517291155%20-0.136771,51.49568879636275%20-0.13303228010159693,51.49599517291155%20-0.12954820543366538,51.49689343537215%20-0.12655610569291312,51.4983224010735%20-0.12425984933466153,51.500184732673425%20-0.12281596051991586,51.50235355967132%20-0.12232294207288667,51.50468111255005%20-0.12281453478458788,51.507008784324505%20-0.12425737988858902,51.50917793615162%20-0.12655325422213062,51.51104071147652%20-0.12954573598746627,51.51247012090285%20-0.13303085436614234,51.513368708192694%20-0.136771,51.51367520363725%3C/gml:coordinates%3E%3C/gml:LinearRing%3E%3C/gml:outerBoundaryIs%3E%3C/gml:Polygon%3E%3C/ogc:Intersects%3E%3C/ogc:Filter%3E&count=100&startIndex=0

```

The OS Features API returns up to 100 features per transaction. In some cases there may be more than 100 features within 1km of the location to find, meaning we need to fetch all features that match query parameters, then find the ones nearest the point we're searching for in the browser. 

For this, we wrote a recursive function that fetches sequential sets of results until all features have been returned from the API. Once all features have been fetched, we move into the next step, finding nearest features - logic that is executed in the browser. 

```javascript

// Use fetch() method to request GeoJSON data from the OS Features API.
    
    // Calls will be made until the number of features returned is less than the
    // requested count, at which point it can be assumed that all features for
    // the query have been returned, and there is no need to request further pages.
    function fetchWhile(resultsRemain) {
        if ( resultsRemain ) {

            fetch(getUrl(wfsParams))
                .then(response => response.json())
                .then((data) => {

                    wfsParams.startIndex += wfsParams.count;

                    geojson.features.push.apply(geojson.features, data.features);
                    // ^^ we'll define `geojson` before the function is called

                    resultsRemain = data.features.length < wfsParams.count ? false : true;

                    fetchWhile(resultsRemain);
                })
                .catch((err) => { console.error(err); });
        }
        else {
            removeSpinner(); // <- Visual feedback for the user
            if( geojson.features.length ) {
                return findNearestN(pointToFind, geojson, 20, typeName);
            } else {
                notification.show('error', "No features found");
            }
        }
    }

```

Once we've fetched all matching features, the features nearest the query point are returned using the `findNearestN()` function. Let's have a look at the code.

```javascript
function findNearestN(point, featurecollection, n, typeName) {

    // Calculate distances, add to properties of feature collection
    var polygons = featurecollection.features
    for (var i = 0; i < featurecollection.features.length; i++) {

        // Here we add the distance to the query point to the polygon's `properties` object.
        polygons[i] = addDistanceFromPointToPolygon(point, polygons[i]);
    }

    // Sort ascending by distance property
    polygons = polygons.sort((a,b) => a.properties.distanceToPoint - b.properties.distanceToPoint);
    
    // create GeoJSON FeatureCollection of 0-n features.
    var nearestFeatures = {
        type: "FeatureCollection",
        features: polygons.slice(0, n)
    }

    // Add the FeatureCollection 
    foundFeaturesGroup.addLayer(createGeoJSONLayer(nearestFeatures, typeName));
        // createGeoJSONLayer() returns a new L.geoJson object
    
    // Pan / zoom the map to the query result
    map.fitBounds(foundFeaturesGroup.getBounds());

}


// Calculates distance from point to polygon in km and adds the value to the polygon's properties.
function addDistanceFromPointToPolygon(point, polygon) {

    var nearestDistance = 100;

    if( turf.booleanWithin(point, polygon) ) {
        polygon.properties.distanceToPoint = 0;
        return polygon;
    }

     // {Turf.js} Iterate over coordinates in current polygon feature.
    turf.coordEach(polygon, function(currentCoord) {
        // {Turf.js} Calculates the distance between two points in kilometres.
        var distance = turf.distance(point, turf.point(currentCoord));

        // If the distance is less than that whch has previously been calculated
        // replace the nearest values with those from the current index.
        if( distance <= nearestDistance ) {
            nearestDistance = distance;
        }
    });

    // After the loop completes, add the attribute to polygon.properties
    polygon.properties.distanceToPoint = nearestDistance;
    return polygon;
}
```

Now all we need to do is set up a few holder variables that are referenced in the functions above and we can start start the process:

```javascript 

// Create an empty GeoJSON FeatureCollection.
var geojson = {
    "type": "FeatureCollection",
    "features": []
};
geojson.features.length = 0;

var resultsRemain = true;

fetchWhile(resultsRemain);
    // Remember, when resultsRemain = false, findNearestN() is called and nearest features are added to the map.

```

Thanks for working through this tutorial. 
