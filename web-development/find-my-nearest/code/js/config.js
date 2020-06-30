/*
 * Configuration settings
 */
var config = {};

config.apikey = "YOUR_KEY_HERE ";

config.defaultField = {
  mapLayer01: "PC",
  mapLayer02: "name1",
  mapLayer03: "name"
};

(config.isLeaflet = typeof L !== "undefined" ? true : false),
  (config.isMapboxGL = typeof mapboxgl !== "undefined" ? true : false);
