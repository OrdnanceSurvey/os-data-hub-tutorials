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
