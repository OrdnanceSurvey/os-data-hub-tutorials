
var initLoad = true;

var coordsToFind = null;

// 1. 
// Initialize the map.
var wmtsServiceUrl = 'https://osdatahubapi.os.uk/OSMapsAPI/wmts/v1';
var wfsServiceUrl = 'https://osdatahubapi.os.uk/OSFeaturesAPI/wfs/v1';

// Initialize the map.
var mapOptions = {
    minZoom: 7,
    maxZoom: 20,
    center: [54.425, -2.968],
    zoom: 14,
    attributionControl: false,
    zoomControl: false
};

var map = new L.map('map', mapOptions);

// Load and display WMTS tile layer on the map.
var basemapQueryString = generateQueryString();

var basemap = L.tileLayer(
    wmtsServiceUrl + "?" + basemapQueryString,
    { maxZoom: 20 }
).addTo(map);

// Add scale control to the map.
var ctrlScale = L.control.scale({ position: 'bottomright' }).addTo(map);


// Define the layer styles.
var styles = {
    'Zoomstack_Greenspace': {
        color: osColours.qualitative.lookup['2'],
        fillOpacity: 0.5,
        weight: 1
    },
    "Zoomstack_Woodland": {
        color: osColours.qualitative.lookup['3'],
        fillOpacity: 0.5,
        weight: 1
    },
    "Zoomstack_LocalBuildings": {
        color: osColours.qualitative.lookup['4'],
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
    let featureTypeToFind = $('#feature-type-select span').text();
    let typeName = getFeatureTypeToFind(featureTypeToFind);

    // {Turf.js} Create a point from the centre position.
    var pointToFind = turf.point(coordsToFind);

    // {Turf.js} Takes the centre point coordinates and calculates a circular polygon
    // of the given a radius in kilometers; and steps for precision.
    var circle = turf.circle(coordsToFind, 1, { steps: 24, units: 'kilometers' });

    // Get the circle geometry coordinates and return a new space-delimited string.
    var coords = circle.geometry.coordinates[0].join(' ');

    // Create an OGC XML filter parameter value which will select the Greenspace
    // features intersecting the circle polygon coordinates.
    // *** ADD Functionality to filter by Type attribute based on dropdown input!
    var xml = `<ogc:Filter>
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
    </ogc:Filter>`


    // Define parameters object.
    let wfsParams = {
        key: config.apikey,
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


    // Create an empty GeoJSON FeatureCollection.
    var geojson = {
        "type": "FeatureCollection",
        "features": []
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
                .then(response => response.json())
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
                .catch((err) => { console.error(err); });
        }
        else {
            // When no results remain
            removeSpinner();
            if (geojson.features.length) {
                // Call the function to analyse distance and find nearest 20 features
                findNearestN(pointToFind, geojson, 20, typeName);
                return;
            } else {
                notification.show('error', "No features found");
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
    var polygons = featurecollection.features
    for (var i = 0; i < featurecollection.features.length; i++) {
        polygons[i] = addDistanceFromPointToPolygon(point, polygons[i]);
    }

    // Sort by distance property
    polygons = polygons.sort((a, b) => a.properties.distanceToPoint - b.properties.distanceToPoint);

    // create FeatureCollection of 0-n features.
    var nearestFeatures = {
        type: "FeatureCollection",
        features: polygons.slice(0, n)
    }

    // Add nearest features to the Leaflet map
    foundFeaturesGroup.addLayer(new L.geoJson(nearestFeatures, {
        style: styles[typeName]
    }));

    // Alert the user
    notification.show('success', nearestFeatures.features.length + ' nearest features found!', false)
    
    // And fit map bounds to the features we found:
    map.fitBounds(foundFeaturesGroup.getBounds(), {
        paddingTopLeft: [
            $(".osel-sliding-side-panel").width() + 25,
            25
        ],
        paddingBottomRight: [25,25]
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
        .map(paramName => paramName + '=' + encodeURI(params[paramName]))
        .join('&');

    return wfsServiceUrl + '?' + encodedParameters;
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
        // console.log('distance', distance)
        // If the distance is less than that whch has previously been calculated
        // replace the nearest values with those from the current index.
        if (distance <= nearestDistance) {
            nearestDistance = distance;
        }
    });

    polygon.properties.distanceToPoint = nearestDistance;
    return polygon;

}

$("#map div.zoom-control [class^='zoom-']").not('disabled').click(function () {
    $(this).hasClass('zoom-in') ? map.zoomIn() : map.zoomOut();
});

map.on({
    zoom: function () {
        $("#map div.zoom-control [class^='zoom-']").removeClass('disabled');
        if (map.getZoom() == map.getMaxZoom())
            $("#map div.zoom-control .zoom-in").addClass('disabled');
        if (map.getZoom() == map.getMinZoom())
            $("#map div.zoom-control .zoom-out").addClass('disabled');
    },
    move: function () {
        coordinates.update();
    },
    click: function () {
        resetProperties();
    }
});

map.getPane('shadowPane').style.display = 'none'; // hide shadow pane

// async? or promise ...
function addLayer() {
    map.createPane('foundFeatures');

    var foundFeatures = L.geoJson(null, {
        onEachFeature: onEachFeature,
        pane: 'foundFeatures',
        style: { color: '#666', weight: 2, fillOpacity: 0.3 }
    }),
        mapFeatures = omnivore.geojson('data/sample/boundary.geojson', null, foundFeatures).on('ready', function () {
            // this.eachLayer(bindPopup);
        }).addTo(map);


}

$(".osel-sliding-side-panel.panel-left .layers .layer .layer-element[data-state='unchecked']").each(function () {
    var id = $(this).parent().data('id');
    $(map.getPane(id)).addClass('hidden');
});

// sortLayers();

function onEachFeature(feature, layer) {
    layer.on('click', function (e) {
        L.DomEvent.stopPropagation(e);

        sliderRight.slideReveal("hide");

        var coord = e.latlng
        offset = feature.geometry.type === 'Point' ? [0, -22] : [0, 8];

        var str = '';
        $.each(feature.properties, function (k, v) {
            var value = (v !== '') ? v : '&lt;null&gt;';
            str += '<div class="property"><div>' + k + '</div><div>' + value + '</div></div>';
        });

        $(".osel-feature-properties").html(str);
        $(".osel-sliding-side-panel.panel-right [class^='scroller']").scrollTop(0).scrollLeft(0);

        var popupContent = '\
            <div class="osel-popup-content">\
                <div class="osel-popup-heading">\
                    <div class="osel-popup-title">' + feature.properties[config.defaultField[layer.options.pane]] + '</div>\
                </div>\
                <div class="osel-popup-link">More details</div>\
            </div>\
        ';

        displayPopup(popupContent, coord, offset, mapOffsetX);
    });
}

function sortLayers() {
    $("ul.layers .layer").reverse().each(function (index) {
        var id = $(this).data('id');
        map.getPane(window[id].options.pane).style.zIndex = 650 + index;
    });
}

function toggleLayer(elem, type) {
    resetProperties();

    var id = elem.parent().data('id');
    $(map.getPane(window[id].options.pane)).toggleClass('hidden');
}

function resetProperties() {
    $(".osel-fixed-popup").remove();
    map.closePopup();
    sliderRight.slideReveal("hide");
}

function generateQueryString(style = defaults.basemapStyle) {

    // Define parameters object.
    let params = {
        key: config.apikey,
        service: 'WMTS',
        request: 'GetTile',
        version: '2.0.0',
        height: 256,
        width: 256,
        outputFormat: 'image/png',
        style: 'default',
        layer: style + '_3857',
        tileMatrixSet: 'EPSG:3857',
        tileMatrix: '{z}',
        tileRow: '{y}',
        tileCol: '{x}'
    };

    // Construct query string parameters from object.
    return Object.keys(params).map(function (key) {
        return key + '=' + params[key];
    }).join('&');

}
function switchBasemap(style) {
    basemap.setUrl(wmtsServiceUrl + '?' + generateQueryString(style));
}

function zoomToLayerExtent(lyr) {
    map.flyToBounds(window[lyr].getBounds(), {
        padding: [50, 50]
    });
}

function setLayerOpacity(lyr, value) {
    map.getPane(window[lyr].options.pane).style.opacity = value;
}

function getTileServer(style = defaults.basemapStyle) {
    return wmtsServiceUrl + '/' + style + '_3857/{z}/{x}/{y}.png?key=' + config.apikey;
}

function addSpinner() {

    $('#request .find').hide();
    $('#request .fetching').show();

}

function removeSpinner() {

    $('#request .find').show();
    $('#request .fetching').hide();

}

function getFeatureTypeToFind(featureTypeToFind) {

    switch (featureTypeToFind) {
        // case "Green space (OS MasterMap Topo)":
        //     return "Greenspace_GreenspaceArea";
        //     break;
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

    if ($("#select-location").hasClass('active')) {

        $('#map').addClass('selecting');
        map.on('click', function (event) {
            selectLocationOnMap(event);
            $('#select-location').removeClass('active')

            $('#map').removeClass('selecting');
            map.off('click');

        });
    } else {

        $('#map').removeClass('selecting');
        map.off('click');
    }

}

function selectLocationOnMap(event) {
    // On click return location, set to coordsToFind

    // Thanks @ramiroaznar! http://bl.ocks.org/ramiroaznar/2c2793c5b3953ea68e8dd26273f5b93c
    var coord = event.latlng.toString().split(',');
    var lat = coord[0].split('(');
    var lng = coord[1].split(')');

    let coords = [Number(lng[0]), Number(lat[1])];

    updateCoordsToFind(coords);

}

function updateCoordsToFind(coords) {

    coordsToFindGroup.clearLayers();

    coordsToFind = coords;
    L.marker([coordsToFind[1], coordsToFind[0]])
        .addTo(coordsToFindGroup);

    // map.flyTo([coordsToFind[1], coordsToFind[0]])

}

function setUseMyLocation() {

    // TEST IF THIS WORKS when deployed on web server
    // From https://medium.com/better-programming/how-to-detect-the-location-of-your-websites-visitor-using-javascript-92f9e91c095f
    if ("geolocation" in navigator) {
        // check if geolocation is supported/enabled on current browser
        navigator.geolocation.getCurrentPosition(
            function success(position) {
                // for when getting location is a success
                let coords = [
                    position.coords.longitude,
                    position.coords.latitude
                ]
                updateCoordsToFind(coords)
                console.log('latitude:', position.coords.latitude,
                    'longitude:', position.coords.longitude);
            },
            function error(error_message) {
                // for when getting location results in an error
                console.error('An error has occured while retrieving location', error_message)
            }
        );
    } else {
        // geolocation is not supported
        alert('Geolocation is not enabled on this browser. Please select on map.');
        // Alert modal?
    }
}

$.fn.reverse = [].reverse;
