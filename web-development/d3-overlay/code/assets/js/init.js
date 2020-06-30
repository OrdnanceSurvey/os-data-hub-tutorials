/*
 * Configuration settings
 */
var defaults = {
  basemapStyle: "Light",
  copyrightStatement:
    "Contains OS data &copy; Crown copyright and database rights " +
    new Date().getFullYear(),
  fixedPopupMinimumWidth: 768
};

var isLeaflet = typeof L !== "undefined" ? true : false,
  isMapboxGL = typeof mapboxgl !== "undefined" ? true : false;

var os = {};

fetch(
  "https://raw.githubusercontent.com/OrdnanceSurvey/GeoDataViz-Toolkit/master/Colours/GDV-colour-palettes-v0.7.json"
)
  .then((res) => {
    return res.json();
  })
  .then((json) => {
    os.palette = json;
  });
