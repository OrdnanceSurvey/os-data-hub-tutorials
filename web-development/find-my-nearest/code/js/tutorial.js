var initLoad = true;
var coordsToFind = null;

// Set API key
const config = { apikey: "YOUR_KEY_HERE" };

// Define URLs of API endpoints
const endpoints = {
  zxy: "https://api.os.uk/maps/raster/v1/zxy",
  wfs: "https://api.os.uk/features/v1/wfs"
};

// Initialize the map.
var mapOptions = {
  minZoom: 7,
  maxZoom: 20,
  center: [54.425, -2.968],
  zoom: 14,
  attributionControl: false
};

var map = new L.map("map", mapOptions);

// Load and display ZXY tile layer on the map.
var basemap = L.tileLayer(
  endpoints.zxy + "/Light_3857/{z}/{x}/{y}.png?key=" + config.apikey,
  {
    maxZoom: 20
  }
).addTo(map);

// Add scale control to the map.
var ctrlScale = L.control.scale({ position: "bottomright" }).addTo(map);

// Define the layer styles.
var styles = {
  Zoomstack_Greenspace: {
    color: os.palette.qualitative.lookup["2"],
    fillOpacity: 0.5,
    weight: 1
  },
  Zoomstack_Woodland: {
    color: os.palette.qualitative.lookup["3"],
    fillOpacity: 0.5,
    weight: 1
  },
  Zoomstack_LocalBuildings: {
    color: os.palette.qualitative.lookup["4"],
    fillOpacity: 0.5,
    weight: 1
  }
};

// Add layer group to make it easier to add or remove layers from the map.
var foundFeaturesGroup = new L.FeatureGroup().addTo(map);
var coordsToFindGroup = new L.FeatureGroup().addTo(map);

function fetchNearestFeatures(e) {
  // Remove all the layers from the layer group.
  foundFeaturesGroup.clearLayers();

  // Get the centre point of the map window.
  if (!coordsToFind) {
    updateCoordsToFind([map.getCenter().lng, map.getCenter().lat]);
  }

  // From the dropdown selection
  let featureTypeToFind = $("#feature-type-select span").text();
  let typeName = getFeatureTypeToFind(featureTypeToFind);

  // {Turf.js} Create a point from the centre position.
  var pointToFind = turf.point(coordsToFind);

  // {Turf.js} Takes the centre point coordinates and calculates a circular polygon
  // of the given a radius in kilometers; and steps for precision.
  var circle = turf.circle(coordsToFind, 1, { steps: 24, units: "kilometers" });
  circle = turf.flip(circle); // GML spatial filters accept coordinates as y,x (lat, lon),
  // so we flip the GeoJSON coordinate pairs, then ...

  // Get the circle geometry coordinates and return a space-delimited string.
  var coords = circle.geometry.coordinates[0].join(" ");

  // Create an OGC XML filter parameter value which will select the Greenspace
  // features intersecting the circle polygon coordinates.
  var xml = `<ogc:Filter>
        <ogc:Intersects>
            <ogc:PropertyName>SHAPE</ogc:PropertyName>
            <gml:Polygon srsName="EPSG:4326">
                <gml:outerBoundaryIs>
                    <gml:LinearRing>
                        <gml:coordinates>${coords}</gml:coordinates>
                    </gml:LinearRing>
                </gml:outerBoundaryIs>
            </gml:Polygon>
        </ogc:Intersects>
    </ogc:Filter>`;

  // Define parameters object.
  let wfsParams = {
    key: config.apikey,
    service: "WFS",
    request: "GetFeature",
    version: "2.0.0",
    typeNames: typeName,
    outputFormat: "GEOJSON",
    filter: xml,
    count: 100,
    startIndex: 0
  };

  // Create an empty GeoJSON FeatureCollection.
  var geojson = {
    type: "FeatureCollection",
    features: []
  };
  geojson.features.length = 0;

  var resultsRemain = true;

  fetchWhile(resultsRemain);

  /** Uses fetch() method to request GeoJSON data from the OS Features API.
   * If features are fetched, analyse to find nearest then add a new GeoJSON
   * layer to the map.
   * Calls will be made until the number of features returned is less than the
   * requested count, at which point it can be assumed that all features for
   * the query have been returned, and there is no need to request further pages.
   * @param {boolean} resultsRemain - Indication to fetch the next page or move on
   */
  function fetchWhile(resultsRemain) {
    if (resultsRemain) {
      fetch(getUrl(wfsParams))
        .then((response) => response.json())
        .then((data) => {
          // Add the newly fetched features to the holder geojson
          geojson.features.push.apply(geojson.features, data.features);

          // Iterate to retrieve the next "page" of results
          wfsParams.startIndex += wfsParams.count;

          // Check if results remain
          resultsRemain = data.features.length < wfsParams.count ? false : true;

          // Recursive function call - will call until resultsRemain == false
          fetchWhile(resultsRemain);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      // When no results remain
      if (geojson.features.length) {
        // Call the function to analyse distance and find nearest 20 features
        findNearestN(pointToFind, geojson, 20, typeName);
        return;
      } else {
        os.notification.show("error", "No features found");
      }
    }
  }
}

/**
 * Determines the nearest n features in a GeoJSON object.
 * @param {object} point - GeoJSON point centroid.
 * @param {object} features - GeoJSON FeatureCollection.
 * @param {integer} n - max number of features to find
 * @param {string} typeName - name of feature type (for styling)
 */
function findNearestN(point, featurecollection, n, typeName) {
  // Calculate distances, add to properties of feature collection
  var polygons = featurecollection.features;
  for (var i = 0; i < featurecollection.features.length; i++) {
    polygons[i] = addDistanceFromPointToPolygon(point, polygons[i]);
  }

  // Sort by distance property
  polygons = polygons.sort(
    (a, b) => a.properties.distanceToPoint - b.properties.distanceToPoint
  );

  // create FeatureCollection of 0-n features.
  var nearestFeatures = {
    type: "FeatureCollection",
    features: polygons.slice(0, n)
  };

  // Add nearest features to the Leaflet map
  foundFeaturesGroup.addLayer(
    new L.geoJson(nearestFeatures, {
      style: styles[typeName]
    })
  );

  // Alert the user
  os.notification.show(
    "success",
    nearestFeatures.features.length + " nearest features found!"
  );

  // And fit map bounds to the features we found:
  map.fitBounds(foundFeaturesGroup.getBounds(), {
    paddingTopLeft: [os.main.viewportPaddingOptions().left + 25, 25],
    paddingBottomRight: [25, 25]
  });
}

/**
 * Creates a GeoJSON layer.
 * @param {object} obj - GeoJSON features object.
 * @param {object} style - Style options.
 */
function createGeoJSONLayer(obj, style) {
  return new L.geoJson(obj, {
    style: styles[style]
  });
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

function addDistanceFromPointToPolygon(point, polygon) {
  var nearestDistance = 100;

  if (turf.booleanWithin(point, polygon)) {
    polygon.properties.distanceToPoint = 0;
    return polygon;
  }

  // {Turf.js} Iterate over coordinates in current greenspace feature.
  turf.coordEach(polygon, function (currentCoord) {
    // {Turf.js} Calculates the distance between two points in kilometres.
    var distance = turf.distance(point, turf.point(currentCoord));

    // If the distance is less than that whch has previously been calculated
    // replace the nearest values with those from the current index.
    if (distance <= nearestDistance) {
      nearestDistance = distance;
    }
  });

  polygon.properties.distanceToPoint = nearestDistance;
  return polygon;
}

$("#map div.zoom-control [class^='zoom-']")
  .not("disabled")
  .click(function () {
    $(this).hasClass("zoom-in") ? map.zoomIn() : map.zoomOut();
  });

map.on({
  zoom: function () {
    $("#map div.zoom-control [class^='zoom-']").removeClass("disabled");
    if (map.getZoom() == map.getMaxZoom())
      $("#map div.zoom-control .zoom-in").addClass("disabled");
    if (map.getZoom() == map.getMinZoom())
      $("#map div.zoom-control .zoom-out").addClass("disabled");
  }
});

function toggleLayer(elem, type) {
}

function filterLayer(elem) {
}

function switchBasemap(style) {
  basemap.setUrl(getTileServer(style));
}

function getTileServer(style = defaults.basemapStyle) {
  return (
    endpoints.zxy + "/" + style + "_3857/{z}/{x}/{y}.png?key=" + config.apikey
  );
}

function getFeatureTypeToFind(featureTypeToFind) {
  switch (featureTypeToFind) {
    case "Greenspace":
      return "Zoomstack_Greenspace";
      break;
    case "Woodland":
      return "Zoomstack_Woodland";
      break;
    case "Building":
      return "Zoomstack_LocalBuildings";
      break;
  }
}

function toggleClickCoordsListener() {
  if ($("#select-location").hasClass("active")) {
    $("#map").addClass("selecting");
    map.on("click", function (event) {
      selectLocationOnMap(event);
      $("#select-location").removeClass("active");

      $("#map").removeClass("selecting");
      map.off("click");
    });
  } else {
    $("#map").removeClass("selecting");
    map.off("click");
  }
}

function selectLocationOnMap(event) {
  var coords = [event.latlng.lng, event.latlng.lat];
  updateCoordsToFind(coords);
}

function updateCoordsToFind(coords, locate = false) {
  coordsToFindGroup.clearLayers();

  coordsToFind = coords;
  L.marker([coordsToFind[1], coordsToFind[0]]).addTo(coordsToFindGroup);

  if (locate)
    map.fitBounds(coordsToFindGroup.getBounds(), {
      paddingTopLeft: [os.main.viewportPaddingOptions().left, 0],
      paddingBottomRight: [0, 0],
      maxZoom: 14
    });
}

function setUseMyLocation() {
  // Adapted from https://medium.com/better-programming/how-to-detect-the-location-of-your-websites-visitor-using-javascript-92f9e91c095f
  if ("geolocation" in navigator) {
    // check if geolocation is supported/enabled on current browser
    navigator.geolocation.getCurrentPosition(
      function success(position) {
        // for when getting location is a success
        let coords = [position.coords.longitude, position.coords.latitude];
        updateCoordsToFind(coords, true);
      },
      function error(error_message) {
        // Notify that location detection resulted in an error
        os.notification.show(
          "error",
          "An error has occured while retrieving location:<br/><br/>" +
            error_message.message
        );
        console.error(
          "An error has occured while retrieving location",
          error_message
        );
      }
    );
  } else {
    // Notify user that geolocation is not supported
    os.notification.show(
      "error",
      "Geolocation is not enabled on this browser. Please select on map."
    );
  }
}
