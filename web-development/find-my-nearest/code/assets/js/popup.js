function displayPopup(popupContent, coord, offset, mapOffsetX) {
    if( $(window).width() <= defaults.fixedPopupMinimumWidth ) {
        var fixedPopup = '\
            <div class="osel-fixed-popup">\
                <button class="osel-fixed-popup-close-button" type="button" aria-label="Close popup">×</button>\
                ' + popupContent + '\
            </div>\
        ';
        $(document.body).append(fixedPopup);
    }
    else {
        if( isLeaflet ) {
            var popup = L.popup({
                    offset: offset
                })
                .setLatLng(coord)
                .setContent(popupContent)
                .openOn(map);
        }
        else if( isMapboxGL ) {
            var popup = new mapboxgl.Popup({
                    closeOnClick: false,
                    anchor: 'bottom',
                    offset: offset
                })
                .setLngLat(coord)
                .setHTML(popupContent)
                .addTo(map);

            var pw = $(".mapboxgl-popup").width() / 2,
                ph = $(".mapboxgl-popup").height();

            var w = $(window).width(),
                h = $(window).height(),
                x = Math.round(Number(map.project(coord).x)),
                y = Math.round(Number(map.project(coord).y));

            var offsetX = x - (w /2 ),
                offsetY = -(h / 2) + y;

            offsetY += sliderProperties().top / 2

            if( x <= mapOffsetX + pw ) // left
                offsetX = -((w / 2) - (mapOffsetX + pw));
            if( x >= w - pw - 8 ) // right
                offsetX = ((w / 2) - pw) - 8;
            if( y <= ph + 16 ) // top
                offsetY = -((h / 2) - (ph - popup.options.offset[1] + (sliderProperties().top / 2) + 8));

            map.flyTo({ center: coord, offset: [ offsetX, offsetY ] });

            popup.on('close', function(e) {
                sliderRight.slideReveal("hide");
                removeHighlight();
            });
        }
    }
}

$(document.body).on('click', '.osel-popup-content .osel-popup-link', function() {
    sliderRight.slideReveal("show");
});

$(document.body).on('click', '.osel-fixed-popup-close-button', function() {
    $(".osel-fixed-popup").remove();
    if( isMapboxGL )
        removeHighlight();
});
