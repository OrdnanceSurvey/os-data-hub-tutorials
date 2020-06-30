Good storytellers bring the reader into their world. They share details to help transport people into different places and times. With maps, storytellers can add a rich visual context to deeply capture the readers imagination.

With this tutorial we will explore how to tell stories with maps. This is a pattern gaining popularity with data journalists looking to expand their storytelling toolkit. By connecting map views to sections of the story, and smoothly animating map transitions, stories can be brought to life and readers can improve their understanding of the subject - from a global to local scale.

The story will follow an October ascent of Ben Nevis, Great Britain's tallest mountain.

<p><iframe style="width:100%;height:400px;max-width:1200px;border:1px solid #f5f5f5;" src="/public/os-data-hub-tutorials/dist/web-development/scroll-story"></iframe></p>

## HTML & CSS

The HTML and CSS for this tutorial is quite lightweight. In [`index.html`](https://github.com/johnx25bd/os-data-hub-api-tutorials/blob/master/web-development/scroll-story/code/index.html), we load the Mapbox GL JS stylsheets and JavaScript library, along with [Scrollama](https://github.com/russellgoldenberg/scrollama) for detecting scroll events. We also load a local `style.css` stylesheet with a few styling rules.

In the document `<body>`, we create two `<div>`s: `#map` and `#story`. We then load an execute scripts: `js/config.js` and `js/tutorial.js`. (We also create a few helper functions and variables in `js/helpers.js`) It is inside these JavaScipt files that the story content is written, the map is created, and the scroll story is set up.

## `config.js`

In the config file, a single global variable is declared: `config`. The assigned object literal has a number of properties that are accessed by the JavaScript code executed in `tutorial.js`. These include the story `title`, `subtitle`, and a `chapters` array, which will be displayed in `<div>` elements on the page.

Here's an example object in this `chapters` array - each property will be used in the coming code:

```javascript
{
    id: 'scotland',
    title: 'Scotland in October.',
    image: [''],
    description: `A 4,413-foot tall collapsed volcano, Ben Nevis is Great Britain\'s highest peak
                    (<a href="https://en.wikipedia.org/wiki/Ben_Nevis" target="_blank">Wikipedia</a>).
                    The mountain is near the town of Fort William, at the mouth of the Rivers Lochy and Nevis.
                    On October 23, 2017 we woke up before dawn in Edinburgh and make the drive to the base of
                    the mountain.`,
    location: {
        center: [-4.80831, 56.35052],
        zoom: 7.92,
        pitch: 9.50,
        bearing: 0.00
    },
    onChapterEnter: [
        { layer: "route", opacity: 0 },
        { layer: 'marker', opacity: 0 },
        { layer: 'shelter', opacity: 0 }
    ],
    onChapterExit: [
        {
            layer: 'shelter',
            opacity: 0
        }
    ]
}
```

### The `chapters`

Just as in a book, the story is divided into chapters - represented as an array of objects. Eact `chapter` object has the following properties:

| Key              | Value                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `id`             | `{string}` - unique id                                                                                                 |
| `title`          | `{string}` - chapter heading                                                                                           |
| `image`          | `{array of strings}` - strings are paths to images                                                                     |
| `description`    | `{string}` - HTML chapter copy                                                                                         |
| `location`       | `{object}` - options for `mapboxgl.Map().flyTo() method` ([docs](https://docs.mapbox.com/mapbox-gl-js/api/#map#flyto)) |
| `onChapterEnter` | `{array of objects}` - map layer IDs and opacities to set on enter                                                     |
| `onChapterExit`  | `{array of objects}` - map layer IDs and opacities to set on exit                                                      |

_(Note: this is slightly adapted from the Mapbox storytelling template, to enable multiple images in the same chapter.)_

We'll be using all of these properties to create our scroll story. The `location` `object` deserves extra attention as this is where we declare the `center`, `zoom`, `pitch` and `bearing` values - which ultimately determine what is visible on the map that appears in the viewport. Mapbox provides a handy [Location Helper](https://demos.mapbox.com/location-helper/) interface to capture these values.

## `tutorial.js`

The logic of the app is written in `tutorial.js`. We'll break up the process into a few steps. These rely on a `config.js` document that has the story chapters, as well as locations and layers to load on chapter enter and exit. It's easiest to adapt that once the entire app is working, so you can see the changes you're making to the story.

We'll follow these steps:

1. First we will create our map, connected to the OS Vector Tile API. You'll need an API key, available on the [OS Data Hub](https://osdatahub.os.uk/).
2. Then we'll create the structure of our HTML document by creating elements based on the `config` data.
3. We'll load the story-specific vector layers onto the map. These features were fetched from the OS Features API, and are stored in local GeoJSON files.
4. Last we'll set up our `scrollama` scroller, which detects when we scroll to a new chapter, and updates the map accordingly.

Let's dive in.

### Our vector tile map

This scroll story will use some advanced animations, including ones that change the camera's pitch. Vector tiles are particularly well-suited for slick, fast animated web maps, so we'll be using the OS Vector Tile API.

We'll be using Mapbox GL JS, so let's create a map and connect to the API:

```javascript
// Set up Mapbox GL JS map with OS Vector Tile API
config.apikey = "YOUR_KEY_HERE";
const endpoints = {
  vts = "https://api.os.uk/maps/vector/v1/vts"
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
```

That's it! Now we've got a vector tile basemap. We'll be adding layers later on - for now let's move on to building our HTML document.

### Creating our HTML

We have all the information we need for our story in the object assigned to the `config` variable. We essentially create a new HTML element for each of the relevant properties we have in the `config` object. This uses vanilla JavaScript. It's worth noting: this code is based on the [Mapbox storytelling template](https://github.com/mapbox/storytelling), so it may look familiar.

First we'll set up the story header:

```javascript
var story = document.getElementById("story");
var features = document.createElement("div");
features.classList.add(alignments[config.alignment]);
features.setAttribute("id", "features");

var header = document.createElement("div");

if (config.title) {
  var titleText = document.createElement("h1");
  titleText.innerText = config.title;
  header.appendChild(titleText);
}

if (config.subtitle) {
  var subtitleText = document.createElement("h2");
  subtitleText.innerText = config.subtitle;
  header.appendChild(subtitleText);
}

if (config.byline) {
  var bylineText = document.createElement("p");
  bylineText.innerText = config.byline;
  header.appendChild(bylineText);
}

if (header.innerText.length > 0) {
  header.classList.add(config.theme);
  header.setAttribute("id", "header");
  story.appendChild(header);
}
```

Then, we'll loop through each of the chapters and create an element with the title, images, description and so on - then append it to our `features` div.

Once chapters are added and the `features` div is built, we append it to our holder `story` div.

```javascript
var story = document.getElementById("story");
var features = document.createElement("div");
features.classList.add(alignments[config.alignment]);
features.setAttribute("id", "features");

var header = document.createElement("div");

if (config.title) {
  var titleText = document.createElement("h1");
  titleText.innerText = config.title;
  header.appendChild(titleText);
}

if (config.subtitle) {
  var subtitleText = document.createElement("h2");
  subtitleText.innerText = config.subtitle;
  header.appendChild(subtitleText);
}

if (config.byline) {
  var bylineText = document.createElement("p");
  bylineText.innerText = config.byline;
  header.appendChild(bylineText);
}

if (header.innerText.length > 0) {
  header.classList.add(config.theme);
  header.setAttribute("id", "header");
  story.appendChild(header);
}

story.appendChild(features);
```

And finally we add on a footer, if included. The template also includes the option to place a marker at map center for each chapter - so that gets created as well.

```javascript
var footer = document.createElement("div");

if (config.footer) {
  var footerText = document.createElement("p");
  footerText.innerHTML = config.footer;
  footer.appendChild(footerText);
}

if (footer.innerText.length > 0) {
  footer.classList.add(config.theme);
  footer.setAttribute("id", "footer");
  story.appendChild(footer);
}

var marker = new mapboxgl.Marker();
if (config.showMarkers) {
  marker.setLngLat(config.chapters[0].location.center).addTo(map);
}
```

Now we've got a vector tile basemap and HTML with header, chapters and a footer. We're ready to add our custom map layers.

### Custom map layers

For this demo we add three GeoJSON layers to our map - a point, line and polygon. These features represent the summit marker, the trail up the mountain and the building at the top of Ben Nevis - the goal is to show what is possible. Custom layers are often crucial to the story.

Most of this logic can only happen once the `map` is loaded - otherwise there is no map to add the layers to. We'll get there in a second, but first we need to create an array of objects called `layers`. Each object will have information including layer `id`, the `source` (which is a path to the GeoJSON file), and the layer `type`.

```javascript
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
```

We will use JavaScript's `fetch` to request the GeoJSON stored in each of these files. This will take place inside the `map.on('load')` callback, which is asynchronous - important because the GeoJSON data needs to be loaded before it gets added to the map.

```javascript
map.on("load", async function () {
    /*
        First, we set up the geographic layers we will
        visualise in the scroll story.
     */

    // In this step we fetch GeoJSON and add them to each object
    // in the layers array:
    let responses = await Promise.all(
        layers.map(layer => fetch(layer.source))
    );

    let geojsonLayers = await Promise.all(
        responses.map(async (res) => await res.json())
    );

    for (let i = 0; i < layers.length; i++) {
        layers[i].geojson = geojsonLayers[i]
    }

// We won't close the callback yet - more to do.
```

This results in our a `geojson` key being added to each object in the `layers` array, with a GeoJSON object as its value.

We then loop through the layers we want to visualise, adding each as a source, then a layer as required by the the Mapbox GL JS API. Note how we add each layer based on its type, so the right layer is added:

```javascript
layers.forEach((layer) => {
  // Each layer needs a source:
  map.addSource(layer.id + "-source", {
    type: "geojson",
    data: layer.geojson,
  });

  // Add a layer with appropriate obtions
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
```

Great, now the GeoJSON layers are added - a point, a line and a polygon. This opens the story maps up to the capabilities of Mapbox GL JS, which can work with [raster imagery](https://docs.mapbox.com/mapbox-gl-js/example/image-on-a-map/), [custom vector tiles](https://docs.mapbox.com/mapbox-gl-js/example/vector-source/), [heatmaps](https://docs.mapbox.com/mapbox-gl-js/example/heatmap-layer/), [3D graphics](https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/) and more.

## Set up the `scroller`

When a new chapter scrolls into view, the chapter map view needs to be triggered. Scrollama makes this easy by using [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to keep track of where elements are on the page.

The `.setup()` method instructs which elements to watch for - in this case, `<div>`s classed with `.step`. The `step` property defines how far from the top of the page the chapter `<div>` needs to be scrolled to before the step entry event fires - we set ours to `0.5`, or 50%. And the `progress` attribute tells the library 'whether to fire incremental step progress updates' - letting you tie functionality to the exact position within a chapter someone is. (We don't use this here, so we set it to false.)

Once the `scroller` is set up, we just chain two more method calls: `.onStepEnter()` and `.onStepExit()`. These methods accept a callback function which is passed an object describing the chapter being entered or exited, and the direction of scroll.

With this functionality, plus the `config` object declared in the global scope, we can manipulate our map and story chapters whenever they scroll into position.

In this case we change element classes and call the `map.flyTo()` method to animate a flight to a new location - but any JavaScript code can be executed here. This opens a world of opportunity with these scroll stories using maps and other interactive visualisation libraries.

```javascript
// Set up the scrollama instance and define step enter
    // and exit callback functions:
    scroller
        .setup({
            step: '.step',
            offset: 0.5,
            progress: false
        })
        .onStepEnter(response => {

            var chapter = config.chapters.find(chap => chap.id === response.element.id);
            response.element.classList.add('active');
            map.flyTo(chapter.location);
            if (config.showMarkers) {
                marker.setLngLat(chapter.location.center);
            }
            if (chapter.onChapterEnter.length > 0) {
                chapter.onChapterEnter.forEach(setLayerOpacity);
            }
        })
        .onStepExit(response => {

            var chapter = config.chapters.find(chap => chap.id === response.element.id);
            response.element.classList.remove('active');
            if (chapter.onChapterExit.length > 0) {
                chapter.onChapterExit.forEach(setLayerOpacity);
            }
        });
}); // <- and here we finally close the map.on('click', callback function!
```

## Wrapping up

With that, we've created a scroll story of an autumn climb up Ben Nevis! We wrote our story in the `config` object literal, including information about how to position the map and which layers to show. We added custom GeoJSON layers that originally came from the OS Features API, and set up an instance of `scrollama` to update the map and content based on which chapter scrolled into view.
