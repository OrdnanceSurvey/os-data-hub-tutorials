const endpoints = {
  zxy: "https://api.os.uk/maps/raster/v1/zxy",
  wfs: "https://api.os.uk/features/v1/wfs"
};

// In the next steps we'll connect
// a mapboxgl.Map object to the OS Maps API:

// Create a map style object using the ZXY service.
var style = {
  version: 8,
  sources: {
    "raster-tiles": {
      type: "raster",
      tiles: [
        endpoints.zxy + "/Light_3857/{z}/{x}/{y}.png?key=" + config.apikey
      ],
      tileSize: 256,
      maxzoom: 20
    }
  },
  layers: [
    {
      id: "os-maps-zxy",
      type: "raster",
      source: "raster-tiles"
    }
  ]
};

// Initialise the map object.
var map = new mapboxgl.Map({
  container: "map",
  minZoom: 7,
  maxZoom: 20,
  style: style,
  center: { lng: -2.2499467257034667, lat: 53.47800737015962 },
  zoom: 15.53
});

// Configure and initialise controls
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

// Add navigation control (excluding compass button) to the map.
map.addControl(
  new mapboxgl.NavigationControl({
    showCompass: false
  })
);

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
map.on("draw.create", activateFetch);
map.on("draw.delete", disactivateFetch);

// Add sources to add data to once it is fetched and analysed
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

document
  .getElementById("fetch-and-calculate")
  .addEventListener("click", async function () {
    let geom = draw.getAll();

    // For this demo we will cap query geometry size to limit the number of API calls
    let area = turf.area(geom.features[0].geometry),
      rounded_area = Math.round(area * 100) / 100;

    if (rounded_area > 100000) {
      os.notification.show(
        "warning",
        "Drawn polygon exceeds maximum size limit of 0.1 square km. Please try again."
      );
      $("#loader").css({ visibility: "hidden" });
      draw.deleteAll();
      return; // <- break out of the callback
    }

    addSpinner();

    let buildings = await getIntersectingFeatures(geom);

    // Initialise a FeatureCollection with an empty features array
    let intersections = {
      type: "FeatureCollection",
      features: []
    };

    turf.featureEach(buildings, function (currentFeature) {
      let intersect = turf.intersect(currentFeature, geom.features[0]);
      if (intersect != null) {
        intersections.features.push(intersect);
      }
    });

    // Declare a variable to hold the computed value
    let percent;

    if (intersections.features.length > 0) {
      percent = turf.area(intersections) / turf.area(geom);

      map.getSource("buildings").setData(buildings);
      map.getSource("buildings-intersection").setData(intersections);

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
      percent = 0;
      map.getSource("buildings").setData(null);
      map.getSource("buildings-intersection").setData(null);
    }

    $("#percent-built span").text((percent * 100).toFixed(2));
    $(".result-label").show();

    // zoom to geom with .osel-panel offset
    map.fitBounds(turf.bbox(buildings), {
      padding: {
        left: os.main.viewportPaddingOptions().left + 50,
        right: 50,
        bottom: 50,
        top: 50
      }
    });
    removeSpinner();

    // Add popup that shows the % of that percentage of that particular
  });

async function getIntersectingFeatures(polygon) {
  // Get the circle geometry coordinates and return a new space-delimited string.
  var coords = turf.flip(polygon.features[0]).geometry.coordinates[0].join(" ");
  console.log(turf.flip(polygon.features[0]));
  console.log(coords);
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
    key: config.apikey,
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

function activateFetch() {
  $("#draw-prompt").text("What is the percent built on?");
  $("#percent-built").css("display", "block");
  $("#fetch-and-calculate").attr("disabled", false);

  map.fitBounds(turf.bbox(draw.getAll()), {
    padding: {
      left: os.main.viewportPaddingOptions().left + 50,
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

/**
 * Return URL with encoded parameters.
 * @param {object} params - The parameters object to be encoded.
 */
function getUrl(params) {
  var encodedParameters = Object.keys(params)
    .map((paramName) => paramName + "=" + encodeURI(params[paramName]))
    .join("&");

  return endpoints.wfs + "?" + encodedParameters;
}

function addSpinner() {
  html = `<div class=" col-12 osel-modal-overlay fetching" style="display:none;">
                <div class="loader" id="loader">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="40px" height="40px"
                        viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve">
                        <path opacity="0.2" fill="#000"
                            d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z" />
                        <path fill="#000"
                            d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0C22.32,8.481,24.301,9.057,26.013,10.047z">
                            <animateTransform attributeType="xml" attributeName="transform" type="rotate"
                                from="0 20 20" to="360 20 20" dur="0.5s" repeatCount="indefinite" />
                        </path>
                    </svg>
                </div>
                <div style="
                    margin-top: 10px;
                    margin-left: 10px;
                ">Fetching results and calculating percent built on ...</div>

            </div>`;

  os.notification.show("info", html, false);
  $(".fetching").show();
}

function removeSpinner() {
  $(".osel-toast-notification").removeClass("info");
  $(".osel-toast-notification").addClass("success");
  $(".osel-toast-notification").text("Success!");

  setTimeout(function () {
    $(".osel-toast-notification").fadeOut(function () {
      $(this).remove();
    });
  }, 2000);
  $("#fetch-and-calculate .find").show();
}
