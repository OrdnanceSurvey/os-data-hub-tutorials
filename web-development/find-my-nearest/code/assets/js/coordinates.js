proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs');

var coordinates = {
    //
    centerArray: [],
    //
    centerIndex: 0,
    //
    init: function() {
        $(".osel-control-container .center-control .panel.coords-box .main [class^='navigate-']").click(function() {
            var t = coordinates.centerIndex,
                i = $(this).hasClass('navigate-next') ? 1 : -1;

            t += i;
            t = t < 0 ? 2 : t;
            t = t > 2 ? 0 : t;

            $(".osel-control-container .center-control .panel.coords-box .navigation .dot").removeClass('active').eq(t).addClass('active');
            $(".osel-control-container .center-control .panel.coords-box .main .coord-value").html(coordinates.centerArray[ t ]);

            coordinates.centerIndex = t;
        });
    },
    //
    update: function() {
        var latLng = map.getCenter(),
            bngPoint = proj4('EPSG:4326', 'EPSG:27700', [ latLng.lng, latLng.lat ]);

        var latLngHTML = 'Lat: ' + latLng.lat.toFixed(4) + '<span>|</span>Lng: ' + latLng.lng.toFixed(4),
            bngCoordsHTML = 'Ea: ' + bngPoint[0].toFixed(0) + '<span>|</span>No: ' + bngPoint[1].toFixed(0),
            bngGridRefHTML = 'OS Grid Ref: ' + coordinates.osgbGridRef(bngPoint[0], bngPoint[1], 5);

        coordinates.centerArray.length = 0;
        coordinates.centerArray.push(bngCoordsHTML, latLngHTML, bngGridRefHTML);

        $(".osel-control-container .center-control .panel.coords-box .main .coord-value").html(coordinates.centerArray[ coordinates.centerIndex ]);
    },
    //
    osgbGridRef: function(easting, northing, precision) {
        var prefixes = new Array(new Array("SV","SW","SX","SY","SZ","TV","TW"),
                                 new Array("SQ","SR","SS","ST","SU","TQ","TR"),
                                 new Array("SL","SM","SN","SO","SP","TL","TM"),
                                 new Array("SF","SG","SH","SJ","SK","TF","TG"),
                                 new Array("SA","SB","SC","SD","SE","TA","TB"),
                                 new Array("NV","NW","NX","NY","NZ","OV","OW"),
                                 new Array("NQ","NR","NS","NT","NU","OQ","OR"),
                                 new Array("NL","NM","NN","NO","NP","OL","OM"),
                                 new Array("NF","NG","NH","NJ","NK","OF","OG"),
                                 new Array("NA","NB","NC","ND","NE","OA","OB"),
                                 new Array("HV","HW","HX","HY","HZ","JV","JW"),
                                 new Array("HQ","HR","HS","HT","HU","JQ","JR"),
                                 new Array("HL","HM","HN","HO","HP","JL","JM"));

        var x = Math.floor(easting / 100000);
        var y = Math.floor(northing / 100000);

        var prefix = prefixes[y][x];

        var e = Math.round(easting % 100000);
        var n = Math.round(northing % 100000);

        e = coordinates.pad(e, 5);
        n = coordinates.pad(n, 5);

        // e += '0000';
        // n += '0000';

        e = e.substr(0, precision);
        n = n.substr(0, precision);

        return prefix + ' ' + e + ' ' + n;
        // return prefix + '&thinsp;' + e + '&thinsp;' + n;
    },
    //
    pad: function(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }
}

coordinates.init();
