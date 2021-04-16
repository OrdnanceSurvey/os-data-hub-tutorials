// API Key in config object
var config = {
    apikey: prompt("Add OS Data Hub Project API Key with access to the OS Vector Tile API and OS Places API.\n* Requires Public Sector or Premium plan")
};

// Endpoints
const endpoints = {
    places: 'https://api.os.uk/search/places/v1',
    vectorTile: 'https://api.os.uk/maps/vector/v1/vts'
};

// Initialise the map object.
var map = new maplibregl.Map({
    container: 'map',
    minZoom: 6,
    // maxZoom: 18,
    style: endpoints.vectorTile + '/resources/styles?key=' + config.apikey,
    center: [-2.968, 54.425],
    zoom: 13,
    transformRequest: url => {
        return {
            url: url + '&srs=3857'
        }
    }
});

// Add navigation control (excluding compass button) to the map.
map.addControl(new maplibregl.NavigationControl());

map.on("style.load", function () {

    // Duplicate 'OS/TopographicArea_1/Building/1' layer to extrude the buildings
    // in 3D using the Building Height Attribute (RelHMax) value.
    map.addLayer({
        "id": "OS/TopographicArea_1/Building/1_3D",
        "type": "fill-extrusion",
        "source": "esri",
        "source-layer": "TopographicArea_1",
        "filter": [
            "==",
            "_symbol",
            33
        ],
        "minzoom": 16,
        "layout": {},
        "paint": {
            "fill-extrusion-color": "#DCD7C6",
            "fill-extrusion-opacity": 0.5,
            "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                16,
                0,
                16.05,
                ["get", "RelHMax"]
            ]
        }
    });

    // Here we add the highlighted layer, with all buildings filtered out. 
    // We'll set the filter to our searched buildings when we actually
    // call the OS Places API and  have a TOID to highlight.
    map.addLayer({
        "id": "OS/TopographicArea_1/Building/1_3D-highlighted",
        "type": "fill-extrusion",
        "source": "esri",
        "source-layer": "TopographicArea_1",
        "filter": ["in", "TOID", ""],
        "minzoom": 16,
        "layout": {},
        "paint": {
            "fill-extrusion-color": "#FF1F5B",
            "fill-extrusion-opacity": 1,
            "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                16,
                0,
                16.05,
                ["get", "RelHMax"]
            ],
        }
    });
});

// Querying the OS Places API
var form = document.getElementById("the-form");
form.addEventListener('submit', lookUpAddress);

async function lookUpAddress(e) {
    e.preventDefault();

    // Clear out existing data
    clearInfoBox();
    map.setFilter("OS/TopographicArea_1/Building/1_3D-highlighted", ["in", "TOID", ""]);
    showSpinner();

    let queryAddress = document.getElementById('address-text').value

    // Check to make sure the user has actually input a value
    if (queryAddress == "") {
        alert('Please input an address to search!');
        hideSpinner()
        return;
    }

    // Fetch addresses from the OS Places API
    let addresses = await fetchAddressFromPlaces(queryAddress);
    hideSpinner()

    // Confirm their query had a matched address
    if (addresses.header.totalresults < 1) {
        alert("No addresses found - please try again.")
        return;
    }

    // Update the info box
    updateInfoBox(addresses);

    // And animate the fly to / highlight the building by TOID
    let coords = [addresses.results[0].DPA.LNG, addresses.results[0].DPA.LAT];
    flyToCoords(coords);
    console.log("Data returned:", addresses)
    highlightTOID(addresses.results[0].DPA.TOPOGRAPHY_LAYER_TOID)

}

async function fetchAddressFromPlaces(address) {

    let url = endpoints.places + `/find?query=${encodeURIComponent(address)}&maxresults=1&output_srs=EPSG:4326&key=${config.apikey}`;

    let res = await fetch(url);
    let json = await res.json()

    return json;
}

// Input relevant information to the map overlay div
function updateInfoBox(placesResponse) {

    let addressString, UPRN, TOID, longitude, latitude;

    addressString = placesResponse.results[0].DPA.ADDRESS;
    UPRN = placesResponse.results[0].DPA.UPRN;
    TOID = placesResponse.results[0].DPA.TOPOGRAPHY_LAYER_TOID;
    longitude = placesResponse.results[0].DPA.LNG;
    latitude = placesResponse.results[0].DPA.LAT;

    document.getElementById('address').innerText = addressString;
    document.getElementById('uprn').innerText = UPRN;
    document.getElementById('toid').innerText = TOID;
    document.getElementById('longitude').innerHTML = longitude;
    document.getElementById('latitude').innerHTML = latitude;
}

function clearInfoBox() {
    document.getElementById('address').innerText = "";
    document.getElementById('uprn').innerText = "";
    document.getElementById('toid').innerText = "";
    document.getElementById('longitude').innerHTML = "";
    document.getElementById('latitude').innerHTML = "";
}

// Animated fly to coords, and rotate camera on arrival
async function flyToCoords(coords) {

    map.once('moveend', function () {
        map.rotateTo(0.0, { duration: 7000 });
    });

    map.flyTo({
        center: coords,
        zoom: 17.5,
        pitch: 75,
        bearing: 180
    });
}

// Highlight the building feature with the TOID returned
// from the OS Places API call
function highlightTOID(toid) {

    let filter = ["in", "TOID", toid];
    map.setFilter("OS/TopographicArea_1/Building/1_3D-highlighted", filter);

}


// Helper functions for the spinner element
function showSpinner() {
    document.getElementById('spinner').style.visibility = 'visible';
}

function hideSpinner() {
    document.getElementById('spinner').style.visibility = 'hidden';
}