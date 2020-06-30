Spatial analysis is a powerful way to understand the world. The insights derived from analysis of points, lines, polygons and raster data can serve as the evidence to inform intelligent decision-making. Let's look at how to build a web interface capable of sophisticated spatial analytics.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/web-development/percent-built-on/"></iframe></p>

## The HTML

Most of this tutorial will focus on the JavaScript required to create this app, but we do need to set up our HTML page so we have the right libraries loaded, and elements with the appropriate classes and IDs.

Have a skim through our `index.html`: you'll notice we load `mapbox-gl.css`, `mapbox-gl-draw.css`, `turf.js`and local stylesheets in the head, and `jquery.js`, `mapbox-gl.js`, `mapbox-gl-draw.js` and local scripts before the closing `</body>` tag.

Other than loading these assets, `index.html` includes elements for the code in `tutorial.js` to interact with, most notably a `#map` div element, a `#percent-built` p element to hold the computed result and a `#fetch-and-calculate` button element.

Alright - on to the JavaScript.

## The API Key

First, head to [osdatahub.os.uk](https://osdatahub.os.uk/) and copy your API key from a project with both the Maps and Features APIs added. We'll start by assigning this string to a constant variable. We'll do the same with the service endpoint urls:

```javascript
const apiKey = "YOUR_API_KEY";
const endpoints = {
  zxy: "https://api.os.uk/maps/raster/v1/zxy",
  wfs: "https://api.os.uk/maps/raster/v1/wfs"
};
```

We won't go over setting up the basemap in detail here - you can find code on how to connect a `mapboxgl.Map` instance to the OS Maps API on our [Examples page](https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-3857-basic-map). Since we'll be overlaying features, the Light cartographic style is a good choice.

## `MapboxDraw`

The [mapbox-gl-draw](https://github.com/mapbox/mapbox-gl-draw) package lets users draw polygons on a Mapbox GL basemap by clicking points. We create a new instance of `MapboxDraw` - for this app we configured the Draw tool with [OS colours](https://github.com/OrdnanceSurvey/GeoDataViz-Toolkit/tree/master/Colours) and customised user interaction modes on the drawn polygon. (We set up these options in [js/config.js](../code/js/config.js) to keep code clean.)

```javascript
// Create a new MapboxDraw instance with styles, controls and interaction modes
var draw = new MapboxDraw({
  styles: mbDrawConfig.styles, // custom OS styles, defined in ./config.js
  displayControlsDefault: false,
  controls: {
    polygon: true,
    trash: true
  },
  modes: {
    ...MapboxDraw.modes,
    simple_select: NewSimpleSelect, // Interaction modes, also defined in ./config.js
    direct_select: NewDirectSelect
  }
});

// Add to map and add event listeners
map.addControl(draw);
```

## "draw." Event Listeners

We don't want the user to be able to fetch data from the OS Features API until we have a polygon to find intersecting features, so we only activate that button's functionality if a polygon is drawn on the map. We define these functions toward the bottom of `tutorial.js`, knowing they'll be [hoisted](https://scotch.io/tutorials/understanding-hoisting-in-javascript) and available for the `'draw.create'` and `'draw.delete'` event listeners:

```javascript
map.on("draw.create", activateFetch);
map.on("draw.delete", disactivateFetch);

// ...

// Defined below 👇 and hoisted 👆
function activateFetch() {
  $("#draw-prompt").text("What is the percent built on?");
  $("#percent-built").css("display", "block");
  $("#fetch-and-calculate").attr("disabled", false);

  map.fitBounds(turf.bbox(draw.getAll()), {
    padding: {
      left: $(".osel-sliding-side-panel").width() + 50,
      right: 50,
      bottom: 50,
      top: 50
    }
  });
}

function disactivateFetch() {
  $("#draw-prompt").text("Draw a polygon to analyse.");
  $("#percent-built").css("display", "none");
  $("#fetch-and-calculate").attr("disabled", true);

  // Clear the building and outlines layers so we can display another query if the user draws a new polygon
  if (map.getLayer("buildings")) {
    map.removeLayer("buildings");
    map.removeLayer("intersection-outline");
  }

  $("#percent-built span").text(". . .");
}
```

## Preparing the map sources

Mapbox GL JS works by visualising styled **layers**, which reference a data **source**.

We'll be adding two sources and layers to visualise in addition to the query polygon the user draws on the map: `buildings` and `buildings-intersection`. Our users might draw a polygon that cuts through a building footprint, and we only want to count the section of the footprint that intersects the query polygon. The `buildings` source / layer will hold and visualise polygons from the OS Features API, and `buildings-intersection` will hold polygon intersections computed in the browser.

Until we have a query to analyse we will just add the sources to the map:

```javascript
map.on("style.load", function () {
  map.addSource("buildings", {
    type: "geojson",
    data: null
  });

  map.addSource("buildings-intersection", {
    type: "geojson",
    data: null
  });
});
```

## Fetch and Calculate!

Most of the logic in this app will be executed once the user has drawn a polygon and clicks Fetch and Calculate.

The things that need to happen:

1. Generate a Features API query to request building features intersecting the drawn geometry - and send the request.
2. Loop through the array of returned building features, creating another array of the building footprints intersecting the query polygon.
3. Calculate the percent built on by dividing the area of the building intersection features by the total area of the query polygon.
4. Add buildings and intersection features to the map, and update the HTML to show the percent built on.

We'll walk through this step by step.

But, of course, all this code only needs to run when the user clicks "Fetch and Run", so we'll start by adding a "click" event listener to that button element. The callback function we define will be executed when the button is clicked - we'll be writing an `async` function to help us write clean code handling asynchronous API calls.

```javascript
document
  .getElementById("fetch-and-calculate")
  .addEventListener("click", async function () {
    addSpinner();
    // 👇 The callback body code will go here!
  });
```

### 1. The OS Features API call

First step: fetch buildings that intersect the query polygon the user drew.

The OS Features API is a Web Features Service. Users can query the API with spatial parameters, including making requests for features that intersect a polygon. Within the callback, we take the geometry of the drawn polygon, `geom`, and call `getIntersectingFeatures(geom)`, which builds the request with the spatial filter and fetches features from the API.

```javascript
let geom = draw.getAll();

// For this demo we will cap query geometry size to limit the number of API calls
let area = turf.area(geom.features[0].geometry),
  rounded_area = Math.round(area * 100) / 100;

if (rounded_area > 100000) {
  notification.show(
    "warning",
    "Drawn polygon exceeds maximum size limit of 0.1 square km. Please try again."
  );
  $("#loader").css({ visibility: "hidden" });
  draw.deleteAll();
  return; // <- break out of the callback
}

let buildings = await getIntersectingFeatures(geom);
```

Let's look closely at the `getIntersectingFeatures` function:

```javascript
async function getIntersectingFeatures(polygon) {
  // Get the circle geometry coordinates and return a new space-delimited string.
  var coords = turf.flip(polygon.features[0]).geometry.coordinates[0].join(" ");

  // Create an OGC XML filter parameter value which will select the Greenspace
  // features intersecting the circle polygon coordinates.
  // *** ADD Functionality to filter by Type attribute based on dropdown input!
  var xml = `<Filter>
                <And>
                <ogc:Intersects>
                    <ogc:PropertyName>SHAPE</ogc:PropertyName>
                    <gml:Polygon srsName="urn:ogc:def:crs:EPSG::4326">
                    <gml:outerBoundaryIs>
                        <gml:LinearRing>
                        <gml:coordinates>${coords}</gml:coordinates>
                        </gml:LinearRing>
                    </gml:outerBoundaryIs>
                    </gml:Polygon>
                </ogc:Intersects>
                <ogc:PropertyIsEqualTo>
                    <ogc:PropertyName>DescriptiveGroup</ogc:PropertyName>
                    <ogc:Literal>Building</ogc:Literal>
                </ogc:PropertyIsEqualTo>
                </And>
                </Filter>`;

  // Define parameters object.
  let wfsParams = {
    key: apiKey,
    service: "WFS",
    request: "GetFeature",
    version: "2.0.0",
    typeNames: "Topography_TopographicArea",
    outputFormat: "GEOJSON",
    srsName: "urn:ogc:def:crs:EPSG::4326",
    filter: xml,
    count: 100,
    startIndex: 0
  };

  // Create an empty GeoJSON FeatureCollection.
  let geojson = {
    type: "FeatureCollection",
    features: []
  };

  geojson.features.length = 0;

  var resultsRemain = true;

  while (resultsRemain) {
    let response = await fetch(getUrl(wfsParams));
    let data = await response.json();

    wfsParams.startIndex += wfsParams.count;
    geojson.features.push.apply(geojson.features, data.features);
    resultsRemain = data.features.length < wfsParams.count ? false : true;

    if (geojson.features.length > 499) {
      console.log("Cutting off queries for demo.");
      resultsRemain = false;
    }
  }

  return geojson;
}
```

So, a call to `getIntersectingFeatures()` with a query geometry will return a GeoJSON FeatureCollection with an array of features representing building polygons from the OS Features API's `Topography_TopographicArea` feature type. With this information we can proceed to the in-client spatial analysis step.

### 2. Looping through intersections

Here we loop through each building feature returned, finding the part of its geometry that is intersecting the query polygon. With this we'll create another GeoJSON FeatureCollection, `intersections`.

We'll use a few functions in the Turf.js library for spatial analysis.

```javascript
// Initialise a FeatureCollection with an empty features array
let intersections = {
  type: "FeatureCollection",
  features: []
};

// Loop through each building feature
turf.featureEach(buildings, function (currentFeature) {
  // This finds the part of the building that intersects the query geometry, `geom`.
  let intersect = turf.intersect(currentFeature, geom.features[0]);
  if (intersect != null) {
    // Add to the intersections.features array
    intersections.features.push(intersect);
  }
});
```

With that we have a GeoJSON FeatureCollection of all the building areas inside the query polygon. We're just ready to work out the percent built on!

### 3. Percent Built On

If any building intersections were detected, we calculate the percent built on and add the buildings and intersections to the map, to visualise the output.

```javascript
// Declare a variable to hold the computed value
let percent;

if (intersections.features.length > 0) {
  // turf.area returns the area in square metres
  percent = turf.area(intersections) / turf.area(geom);

  // Set data to the fetched and derived FeatureCollections
  map.getSource("buildings").setData(buildings);
  map.getSource("buildings-intersection").setData(intersections);

  // Add layer with styling
  map.addLayer({
    id: "buildings",
    source: "buildings",
    type: "fill",
    layout: {},
    paint: {
      "fill-color": os.palette.qualitative.lookup["2"],
      "fill-opacity": 0.3,
      "fill-outline-color": "black"
    }
  });

  // And strong outlines in the vivid OS magenta / pink for intersecting footprints
  map.addLayer({
    id: "intersection-outline",
    source: "buildings-intersection",
    type: "line",
    layout: {},
    paint: {
      "line-color": os.palette.qualitative.lookup["1"],
      "line-width": 2
    }
  });
} else {
  // Logic for if the user drew an area with no buildings
  percent = 0;
  map.getSource("buildings").setData(null);
  map.getSource("buildings-intersection").setData(null);
}
```

### 4. Display the percentage

Last but not least, show the answer by updating the righthand panel with the float value of the percentage built on. We'll also fit map bounds to the target area.

```javascript
$("#percent-built span").text((percent * 100).toFixed(2));
$(".result-label").show();

map.fitBounds(turf.bbox(geojson), {
  padding: {
    left: $(".osel-sliding-side-panel").width() + 50,
    right: 50,
    bottom: 50,
    top: 50
  }
});
removeSpinner();
```

## Wrapping Up

That's it! We've written code that let's a user draw a polygon on an OS Maps API raster basemap, fetch features representing building polygons from the OS Features API, and calculate the percentage of the query geometry that is covered by building footprints.

We used Mapbox GL JS, MapboxDraw, Turf.js, and jQuery to help us with map visualisation, map interactivity, spatial analysis and DOM manipulation.
