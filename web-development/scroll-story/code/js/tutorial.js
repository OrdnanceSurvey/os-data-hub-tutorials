// Instantiate the scrollama scroller - for later
const scroller = scrollama();

// Set up Mapbox GL JS map with OS Vector Tile API
config.apikey = "YOUR_KEY_HERE";
const endpoints = {
  vts: "https://api.os.uk/maps/vector/v1/vts"
}

// Initialize the map object.
const map = new mapboxgl.Map({
  container: "map",
  style: endpoints.vts + "/resources/styles?key=" + config.apikey,
  center: config.chapters[0].location.center,
  zoom: config.chapters[0].location.zoom,
  bearing: config.chapters[0].location.bearing,
  pitch: config.chapters[0].location.pitch,
  scrollZoom: false,
  transformRequest: (url) => {
    url += "&srs=3857";
    return {
      url: url,
    };
  },
});

// Create HTML elements for the story
var story = document.getElementById("story");
var features = document.createElement("div");
features.classList.add(alignments[config.alignment]);
features.setAttribute("id", "features");

var header = document.createElement("div");

if (config.title) {
  let titleText = document.createElement("h1");
  titleText.innerText = config.title;
  header.appendChild(titleText);
}

if (config.subtitle) {
  let subtitleText = document.createElement("h2");
  subtitleText.innerText = config.subtitle;
  header.appendChild(subtitleText);
}

if (config.byline) {
  let bylineText = document.createElement("p");
  bylineText.innerText = config.byline;
  header.appendChild(bylineText);
}

if (header.innerText.length > 0) {
  header.classList.add(config.theme);
  header.setAttribute("id", "header");
  story.appendChild(header);
}

// Loop through and create HTML for each chapter
config.chapters.forEach((record, idx) => {
  let container = document.createElement("div");
  let chapter = document.createElement("div");

  if (record.title) {
    let title = document.createElement("h3");
    title.innerText = record.title;
    chapter.appendChild(title);
  }

  if (record.image) {
    record.image.forEach((source) => {
      let image = new Image();
      image.src = source;
      chapter.appendChild(image);
    });
  }

  if (record.description) {
    let story = document.createElement("p");
    story.innerHTML = record.description;
    chapter.appendChild(story);
  }

  container.setAttribute("id", record.id);
  container.classList.add("step");
  if (idx === 0) {
    container.classList.add("active");
  }

  chapter.classList.add(config.theme);
  container.appendChild(chapter);
  features.appendChild(container);
});

story.appendChild(features);

var footer = document.createElement("div");

if (config.footer) {
  let footerText = document.createElement("p");
  footerText.innerHTML = config.footer;
  footer.appendChild(footerText);
}

if (footer.innerText.length > 0) {
  footer.classList.add(config.theme);
  footer.setAttribute("id", "footer");
  story.appendChild(footer);
}

// A marker, for stories that might show specific points.
var marker = new mapboxgl.Marker();
if (config.showMarkers) {
  marker.setLngLat(config.chapters[0].location.center).addTo(map);
}

// Set up additional layers
const layers = [
  {
    id: "route",
    source: "./data/route.json",
    type: "line",
  },
  {
    id: "shelter",
    source: "./data/shelter.json",
    type: "fill-extrusion",
  },
  {
    id: "marker",
    source: "./data/marker.json",
    type: "circle",
  },
];

map.on("load", async function () {
  // First, we set up the geographic layers we will
  // visualise in the scroll story

  // In this step we fetch GeoJSON ...
  let responses = await Promise.all(
    layers.map((layer) => fetch(layer.source)) // <- creates an array of promises,
    //    one for each layer.source
  );

  let geojsonLayers = await Promise.all(
    responses.map(async (res) => await res.json())
  );

  // ... and add them to each object
  // in the layers array:
  for (let i = 0; i < layers.length; i++) {
    layers[i].geojson = geojsonLayers[i];
  }

  // Now we loop through each layer and add to map:
  layers.forEach((layer) => {
    // Each layer needs a source:
    map.addSource(layer.id + "-source", {
      type: "geojson",
      data: layer.geojson,
    });

    // Add a layer with appropriate options
    // based on the type
    if (layer.type == "fill-extrusion") {
      map.addLayer({
        id: layer.id,
        type: "fill-extrusion",
        source: layer.id + "-source",
        layout: {},
        paint: {
          "fill-extrusion-color": "#088",
          "fill-extrusion-opacity": 0,
          "fill-extrusion-height": 3,
        },
      });
    } else if (layer.type == "circle") {
      map.addLayer({
        id: layer.id,
        type: "circle",
        source: layer.id + "-source",
        paint: {
          "circle-radius": 6,
          "circle-color": "#B42222",
          "circle-opacity": 0,
        },
      });
    } else if (layer.type == "line") {
      map.addLayer({
        id: layer.id,
        type: "line",
        source: layer.id + "-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#888",
          "line-width": 3,
          "line-opacity": 0,
        },
      });
    }
  });
  // Now custom layers have been added to the map!

  // Set up the scrollama instance and define step enter
  // and exit callback functions:
  scroller
    .setup({
      step: ".step",
      offset: 0.5,
      progress: false,
    })
    .onStepEnter((response) => {
      var chapter = config.chapters.find(
        (chap) => chap.id === response.element.id
      );
      response.element.classList.add("active");
      map.flyTo(chapter.location);

      if (config.showMarkers) {
        marker.setLngLat(chapter.location.center);
      }
      if (chapter.onChapterEnter.length > 0) {
        chapter.onChapterEnter.forEach(setLayerOpacity);
      }
    })
    .onStepExit((response) => {
      var chapter = config.chapters.find(
        (chap) => chap.id === response.element.id
      );
      response.element.classList.remove("active");

      if (chapter.onChapterExit.length > 0) {
        chapter.onChapterExit.forEach(setLayerOpacity);
      }
    });
});

// Set up resize event
window.addEventListener("resize", scroller.resize);
