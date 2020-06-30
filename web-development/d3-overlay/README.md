# Title

In this tutorial, we'll learn how to use D3.js to add an overlay of geographic features to an interactive Mapbox GL map. Our goal is to create a smooth-panning and zooming user experience, and to gain access to the amazing capabilities of D3.

![Vector Tile map with a D3 overlay](./media/d3-overlay.png)

## Tools and APIs

We'll use the OS Vector Tile and Features APIs, as well as [D3.js](https://d3js.org/), [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) and [Turf.js](https://turfjs.org/).

## D3 Overlay

"Choose the right tool for the job" - a common sense saying that applies just as well to web development as it does to home improvement.

In this tutorial, we'll learn how to use D3.js to add an overlay of geographic features to an interactive Mapbox GL map. Our goal is to create a smooth-panning and zooming user experience, and to gain access to the amazing capabilities of D3.

## The HTML

Our `index.html` file for this project is very, very simple: we load libraries and place a single `<div id="map">` element within the `<body>` tag. All other elements will be added programmatically in `js/tutorial.js`.

## A vector tile basemap

With Mapbox GL JS, first we'll create a basemap with vector tiles served from the OS Vector Tile API. Since our focus is on the D3 overlay, we won't go into this code in depth - you can find it on our [Examples page](https://labs.os.uk/public/os-data-hub-examples/os-vector-tile-api/vts-3857-basic-map).

One adjustment though: we want our basemap in greyscale, so we can distinguish the overlaid features more easily. The ability to customise style is a major advantage of vector tiles. So, when we instantiate a new `mapboxgl.Map` object, we include a [custom style](https://labs.os.uk/public/os-data-hub-examples/dist/os-vector-tile-api/styles/greyscale.json):

```javascript
const config = { apikey: "YOUR_KEY_HERE" };

const endpoints = {
  vectorTile: "https://api.os.uk/maps/vector/v1/vts",
  features: "https://api.os.uk/maps/features/v1/wfs"
};

// Instantiate a new mapboxgl.Map object.
map = new mapboxgl.Map({
  container: "map",
  style:
    "https://labs.os.uk/public/os-data-hub-examples/dist/os-vector-tile-api/styles/greyscale.json",
  center: [-0.13806, 51.55223],
  zoom: 9,
  transformRequest: (url) => {
    if (url.includes("?key=")) {
      return { url: url + "&srs=3857" };
    } else {
      return {
        url: url + "?key=" + config.apikey + "&srs=3857"
      };
    }
  }
});
```

With the basemap created, we are ready to start working on our overlay.

## A D3 Overlay

Our goal is to add a D3 overlay to our Mapbox basemap, placing SVG elements representing geographic features at their appropriate positions. This is a subtle trick - the user shouldn't be able to recognise the difference between the layers. But - programmatically - the SVG elements will have access to some of the tools D3 makes available, including mouse events, animations and so on.

### Appending the SVG

The first step is to append an `<svg>` element to our `#map` division. This SVG element will hold all of the features we overlay.

We start by getting the dimensions of the `#map` element's bounding client rectangle and appending the `<svg>` element. It is important to assign the result of this operation to a variable - `svg` - as we will be interacting with it shortly. We'll also create new selections for the two layers we are going to overlay, a polygon representing the borough of Camden and points representing rail and tube stations.

```javascript
// Setup our svg layer that we can manipulate with d3
const bbox = document.getElementById("map").getBoundingClientRect();

var svg = d3
  .select("#map")
  .append("svg")
  .style("position", "absolute")
  .style("top", 0)
  .style("left", 0)
  .attr("width", bbox.width)
  .attr("height", bbox.height)
  .style("pointer-events", "none"); // the svg shouldn't capture mouse events, so we can have pan and zoom from mapbox

var stations = svg
  .append("g")
  .classed("stations-group", true)
  .selectAll(".station");

var camdenPoly = svg
  .append("g")
  .classed("camden-group", true)
  .selectAll(".camden");
```

## D3 Geo

D3 is a powerful library for creating interactive geographic visualisation. This tutorial won't go into how it works in depth - but to draw the features in the SVG element we just created we will need a few tools from the D3 toolkit: `d3.geoTransform` and `d3.geoPath`.

### d3.geoTransform and d3.geoPath

We'll use `d3.geoTransform` to transform longitude and latitude decimal coordinates into the x and y pixel values on the screen. We do this by defining a function, `projectPoint`, which accepts `lon` (longitude) and `lat` (latitude) as input parameters and returns `x` and `y` values. Note that the output values will depend on the position of the map in the viewport - which makes sense, as we want to transform the geographic coordinate pairs into the correct pixel coordinates based on the map's _current_ placement.

`d3.geoPath` is a geographic path generator. Geometries for SVG `<path>` elements are defined by the string assigned to the `d` attribute; `d3.geoPath` generates those path data strings from geographic data like points, linestrings and polygons.

```javascript
var transform = d3.geoTransform({ point: projectPoint });
var path = d3.geoPath().projection(transform);

// ... below, but hoisted

// Project any point to map's current state
function projectPoint(lon, lat) {
  var point = map.project(new mapboxgl.LngLat(lon, lat));
  this.stream.point(point.x, point.y);
}
```

### `update()`

`update` is the key to smooth interaction with our SVG overlay. The `update()` function updates the `<path>` elements so they appear to pan and zoom smoothly with the underlying Mapbox basemap. We will call this once the map is set up, adding the `d` attribute to each `path` - here we'll just make sure the function is invoked when `"viewreset"`, `"move"` and `"moveend"` map events are fired.

```javascript
function update() {
  stations.attr("d", path.pointRadius(map.getZoom() / 2));
  camdenPoly.attr("d", path);
}

// Every time the map changes, update the SVG paths
map.on("viewreset", update);
map.on("move", update);
map.on("moveend", update);
```

## Fetching Data

We fetch data dynamically from the OS Features API to visualise in the SVG overlay we added. To do this, we need to create a valid Features API query, fetch the GeoJSON data, then visualise it appropriately.

We're only interested in fetching point data from the `Zoomstack_RailwayStations` feature type that are within the boundaries of of the Borough of Camden.

We downloaded the border of the borough from [Camden's Open Data website](https://opendata.camden.gov.uk/Maps/Camden-Ward-Boundary/yqyi-6agf), then simplified it using the Visvalingam weighted area method on [mapshaper.org](https://mapshaper.org/). This polygon will be used in our XML spatial filter - for now we place the file (`camden-simplified.json`) in the `data` directory.

// GIF of simplifying geometry

Once the basemap is loaded, we call an asynchronous function that loads this GeoJSON, draws the polygon as an SVG `<path>`. Let's see this code before looking at fetching results from the OS Features API.

```javascript


map.on('load', async function () {

    let camden = await d3.json('./data/camden-simplified.json');

    // Zoom the map to show the full borough geometry
    map.fitBounds(turf.bbox(camden.features[0]), { padding: 25 });

    // And bind the features array (which in this case has one element) to the camdenPoly selection from above
    camdenPoly = camdenPoly.data(camden.features)
        // This code will be executed for each data point in the data bound, camden.features
        .join('path')
        .attr('class', 'camden')
        .style('fill', os.palette.qualitative.lookup[1])
        .style('opacity', 0.2)


// We don't close the .on('load') callback just yet!
```

### Fetch rail and tube stations within

Now we construct a filter from the Camden borough geometry, and send a request to the OS Features API. The request will return a GeoJSON FeatureCollection where each Feature in the features array represents a single geometry (in this case, `Point`) that matches query parameters.

```javascript
// Note: this is still inside the map.on('load') callback function body!

// Now, an XML filter for our Features API calls
let coordsString = turf.flip(camden.features[0]).coordinates[0].join(" ");

let xmlFilter = `
    <ogc:Filter>
        <ogc:Within>
        <ogc:PropertyName>SHAPE</ogc:PropertyName>
        <gml:Polygon srsName="urn:ogc:def:crs:EPSG::4326">
            <gml:outerBoundaryIs>
            <gml:LinearRing>
                <gml:coordinates>${coordsString}</gml:coordinates>
            </gml:LinearRing>
            </gml:outerBoundaryIs>
        </gml:Polygon>
        </ogc:Within>
    </ogc:Filter>`;

// The parameters
var params = {
  key: config.apikey,
  typeNames: "Zoomstack_RailwayStations",
  filter: xmlFilter,
  service: "WFS",
  request: "GetFeature",
  version: "2.0.0",
  outputFormat: "GEOJSON",
  srsName: "urn:ogc:def:crs:EPSG::4326",
  count: 100,
  startIndex: 0
};
```

We don't know how many features will match our query. For this reason, we use a `while` loop: while there are still results, fetch the next set of matching features. In this way we "page" through results, building a GeoJSON FeatureCollection of all the features returned by the queries as we go.

```javascript
let resultsRemain = true;
let geojson = { type: "FeatureCollection", features: [] };

while (resultsRemain) {
  // Fetch the GeoJSON
  let response = await fetch(getUrl(endpoints.features, params));
  let data = await response.json();

  // Add result features to our holder GeoJSON features array
  geojson.features.push.apply(geojson.features, data.features);

  // If we didn't receive a full set of results, we've fetched all
  // matching features
  resultsRemain = data.features.length < params.count ? false : true;

  // Iterate to fetch the next "page" of results
  params.startIndex += params.count;
}
```

### Drawing station `<path>`s

One of our last steps: joining the station features to our `stations` selection, and specifying the attributes of each element that is created by D3. We'll set each element's `class` to `station`, then set `fill` to a value dependent on the station type in the feature's `properties` object. We'll also set event listeners to update the position and content of the `div.tooltip` element we appended to the body earlier so the tooltip appears next to the station when we hover on it.

And, finally, we call `update()` to update each `<path>`'s `d` attribute based on the position and zoom level of the basemap.

```javascript
    // Now we can draw our station points as SVG <path> elements
    stations = stations.data(geojson.features)
        .join("path")
        .attr("class", "station")
        .style("fill", (d) => {
            switch (d.properties.Type) {
                case "Railway Station":
                    return os.palette.qualitative.lookup[2];
                    break;
                case "Railway Station And London Underground Station":
                    return os.palette.qualitative.lookup[3];
                    break;
                case "London Underground Station":
                    return os.palette.qualitative.lookup[4];
                    break;
                default:
                    return "black";
            }
        })
        .on("mouseover", (d) => {
            div.style('display', 'block')
                .style('opacity', 1);

            div.html(`<h3>${d.properties.Name}</h3>`)
                .style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
        })
        .on('mouseout', (d) => {
            div.transition()
                .duration(200)
                .style('display', 'none')
                .style('opacity', 0)
        })
        .style("pointer-events", "all");

    update();

}) // Finally we close the map.on('load') callback!
```

And there you have it! We created a custom-styled basemap with Mapbox GL JS and the OS Vector Tile API, added an SVG overlay with D3.js, loaded spatial data from the OS Features API and visualised a polygon and a number of points on the overlay. We connected some event listeners and a dynamic tooltip.

What's more, we fused the amazing world of D3.js with the beautiful interactive vector tile maps built with OS Data Hub APIs and Mapbox GL JS.

Want to see more? Check out our Data Hub APIs on the [OS Data Hub](https://osdatahub.os.uk/).

And let us know if you build on or adapt this tutorial by tweeting at [@OrdnanceSurvey](https://twitter.com/ordnancesurvey) and tagging [#OSDeveloper](https://twitter.com/hashtag/OSDeveloper).
