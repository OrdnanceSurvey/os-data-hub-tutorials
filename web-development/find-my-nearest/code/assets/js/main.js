$.fn.extend({
    toggleText: function(a, b){
        return this.text(this.text() == b ? a : b);
    }
});

$(function() {
    // window resize handler
    $(window).resize(function() {
        $(".osel-navbar-items .user-profile i").text('keyboard_arrow_down');
        $(".osel-user-profile-menu, .osel-more-dropmenu").addClass('hidden');

        if( $.fn.devbridgeAutocomplete )
            $(".osel-search-control form input").devbridgeAutocomplete().setOptions({ width: $(".osel-search-control").width() });

        clearTimeout(window.resizedFinished);
        window.resizedFinished = setTimeout(function() {
            var w = sliderProperties().width,
                h = sliderProperties().height,
                l = parseInt(sliderLeft.css('left')) == 0 ? 0 : -(w - 38),
                r = parseInt(sliderRight.css('right')) == 0 ? 0 : -w;

            sliderLeft.height(h).width(w - 38).css({ 'left': l });
            sliderRight.height(h).width(w).css({ 'right': r });
        }, 300);
    });

    // document body click handler
    $(document.body).click(function(e) {
        if( $(e.target).closest('.osel-more-dropmenu-btn').length === 0 ) {
            $(".osel-more-dropmenu").addClass('hidden');
        }

        if( $(e.target).closest('.osel-navbar-items .user-profile').length === 0 ) {
            $(".osel-navbar-items .user-profile i").text('keyboard_arrow_down');
            $(".osel-user-profile-menu").addClass('hidden');
        }

        if( $(e.target).closest('.osel-dropdown .select').length === 0 ) {
            $(".osel-dropdown .select").removeClass('active').children('i').text('keyboard_arrow_down');
            $(".osel-dropdown .select").parent().children('.options').addClass('hidden');
        }

        if( $(e.target).closest('.osel-overflow-menu .layer-overflow').length > 0 )
            return false;

        hideActionPanels();
    });

    // hide action panel on scroll handler
    $(".osel-sliding-side-panel.panel-left [class^='scroller']").scroll(function() {
        $(document.body).find('.osel-tooltip').remove();
        hideActionPanels();
    });

    $(".osel-more-dropmenu-btn").click(function() {
        $(".osel-more-dropmenu").toggleClass('hidden');
    });

    // update copyright statement
    $(".osel-attribution-container").html(defaults.copyrightStatement);
});


/*
 * Return top/width/height properties for side panels
 */
var sliderProperties = function() {
    var t = $("div.content").length ? 64 : 0,
        w = $(window).width(),
        h = $(window).height() - t;

    if( w >= 420 ) {
        w = w / 4;
        w = Math.max(w, 360); //minimum width
        w = Math.min(w, 480); //maximum width
    }

    return {
        top: t,
        width: w,
        height: h
    };
}


/*
 * Initialise sliding side panels
 */
var mapOffsetX;

var sliderLeft = $(".osel-sliding-side-panel.panel-left").slideReveal({
    width: sliderProperties().width - 38,
    push: false,
    trigger: $(".osel-sliding-side-panel.panel-left .panel-toggle .toggle-handle"),
    autoEscape: false,
    top: sliderProperties().top,
    show: function(obj) {
        obj.find("div.toggle-handle").html('<i class="material-icons">navigate_before</i>');

        // hide right panel if window width < 960px
        if( $(window).width() <= 960 && typeof sliderRight !== 'undefined' )
            sliderRight.slideReveal("hide");
    },
    shown: function() {
        mapOffsetX = sliderProperties().width;
        if( typeof sliderLeftShownHandler === 'function' )
            sliderLeftShownHandler();
    },
    hide: function(obj) {
        obj.find("div.toggle-handle").html('<i class="material-icons">navigate_next</i>');
    },
    hidden: function() {
        mapOffsetX = 38;
        if( typeof sliderLeftHiddenHandler === 'function' )
            sliderLeftHiddenHandler();
    }
});

sliderLeft.height(sliderProperties().height).slideReveal("show");

var sliderRight = $(".osel-sliding-side-panel.panel-right").slideReveal({
    width: sliderProperties().width,
    push: false,
    trigger: $(".osel-sliding-side-panel.panel-right .panel-close"),
    autoEscape: false,
    top: sliderProperties().top,
    position: 'right',
    show: function(obj) {
        obj.addClass('active');

        $(".osel-fixed-popup").remove();

        if( isLeaflet )
            map.closePopup();
        else if( isMapboxGL )
            $(".mapboxgl-popup").remove();

        // hide left panel if window width < 960px
        if( $(window).width() <= 960 && typeof sliderLeft !== 'undefined' )
            sliderLeft.slideReveal("hide");
    },
    shown: function(obj) {
        obj.addClass('active');
        $(".osel-control-container.container-top.container-right").css({ right: sliderProperties().width });
    },
    hide: function() {
        if( isMapboxGL )
            removeHighlight();
    },
    hidden: function(obj) {
        obj.removeClass('active');
        $(".osel-control-container.container-top.container-right").css({ right: 0 });
    }
});

sliderRight.height(sliderProperties().height);


/*
 * Create reorderable drag-and-drop list
 */
if( $.fn.sortable ) {
    $( "ul.layers.sortable" ).sortable({
        axis: 'y',
        cursor: 'move',
        start: function() {
            $('body').find('.osel-tooltip').remove();
            hideActionPanels();
        },
        stop: function() {
            sortLayers();
        }
    });
}


/*
 * Panel tabs
 */
$(".osel-sliding-side-panel .tabs span").click(function() {
    var activeId = $(".osel-sliding-side-panel .tabs span.active").data('id'),
        id = $(this).data('id');

    if( activeId == id )
        return;

    $(this).parent().children('span').removeClass('active');
    $(this).addClass('active');

    switchLayer(id);
});


/*
 * Layers [type = radio]
 */
$(".osel-sliding-side-panel.panel-left .layer .layer-element[data-type='radio']").click(function() {
    var elem = $(this);

    var activeId = $("ul.layers .layer .layer-element[data-type='radio'][data-state='checked']").parent().data('id'),
        id = elem.parent().data('id');

    if( activeId == id )
        return;

    $("ul.layers .layer .layer-element[data-type='radio']").attr('data-state', 'unchecked');
    elem.attr('data-state', 'checked');

    toggleLayer(elem, 'radio');
});


/*
 * Layers [type = checkbox]
 */
 $(".osel-sliding-side-panel.panel-left .layer .layer-element[data-type='checkbox']").click(function() {
    var elem = $(this);

    if( elem.hasClass('disabled') )
        return;

    var checked = elem.attr('data-state') == 'checked' ? 'unchecked' : 'checked',
        container = elem.parent(),
        siblings = container.children('.layer-element[data-type="checkbox"]');

    if( container.hasClass('layer') ) {
        container.find('.layer-element[data-type="checkbox"]').attr('data-state', checked);

        toggleLayer(elem, 'checkbox');
    }
    else {
        elem.attr('data-state', checked);

        var counter = 0;
        siblings.each(function() {
            if( $(this).attr('data-state') == 'checked' )
                counter++;
        });

        var parent = container.parent();
        if( counter == 0 )
            checked = 'unchecked';
        else if( counter == siblings.length )
            checked = 'checked';
        else
            checked = 'indeterminate';

        parent.children('.layer-element[data-type="checkbox"]').attr('data-state', checked);

        // filterLayer(elem);
    }

    // overflow menu handler
    if( $(".osel-overflow-menu").length ) {
        var menu = $(".osel-overflow-menu .layer-overflow[data-parent-id='" + elem.parents('.layer').data('id') + "']")

        if( checked == 'unchecked' ) {
            menu.find('.label, .rangeslider__fill, .rangeslider__handle, output').addClass('disabled');
            menu.find('input[type="range"]').prop({ 'disabled': true }).rangeslider('update');
        }
        else {
            menu.find('.label, .rangeslider__fill, .rangeslider__handle, output').removeClass('disabled');
            menu.find('input[type="range"]').prop({ 'disabled': false }).rangeslider('update');
        }
    }
});

$(".osel-sliding-side-panel .osel-toggle-layers div").click(function() {
    var checked = $(this).attr('id') == 'show-all-layers' ? 'checked' : 'unchecked',
        elem = $(".osel-sliding-side-panel.panel-left .layer .layer-element[data-type='checkbox']");

    elem.attr('data-state', checked);

    elem.each(function() {
        if( $(this).parent().hasClass('layer') )
            toggleLayer($(this), 'checkbox');
    });

    if( $(this).attr('id') == 'clear-all-layers' )
        return;

    $(".osel-sliding-side-panel .osel-toggle-layers div").toggleClass('hidden');
});


/*
 * Layers [actions]
 */
$(".osel-sliding-side-panel.panel-left .layer .layer-element div.toggle i").click(function(e) {
    hideActionPanels();

    e.stopPropagation();

    $(this).toggleText('keyboard_arrow_up', 'keyboard_arrow_down');
    $(this).parents('.layer').children('.layer-options').toggleClass('hidden');
});

$(".osel-sliding-side-panel.panel-left .layer .layer-element div.overflow i").click(function(e) {
    e.stopPropagation();

    var parent = $(this).parents('.layer'),
        id = parent.data('id'),
        top = parent.offset().top;

    var elem = $(".osel-overflow-menu .layer-overflow[data-parent-id='" + id + "']");
    if( elem.hasClass('active') ) {
        elem.removeClass('active').css({ 'top': -9999, 'left': -9999 });
    }
    else {
        hideActionPanels();
        elem.addClass('active').css({ 'top': top + 48, 'left': sliderProperties().width - 348 });

        // display overflow menu above layer element (if not fully within browser viewport)
        var bounding = elem[0].getBoundingClientRect();
        if(! (bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight)) ) {
            elem.css({ 'top': top - (elem.height() - 16) });
        }
    }
});

$(".osel-overflow-menu .layer-overflow .label.interactive").click(function() {
    if( $(this).data('function') == 'extent' ) {
        var layer = $(this).parents('.layer-overflow').data('parent-id');
        if( typeof zoomToLayerExtent === 'function' )
            zoomToLayerExtent(layer);
    }
    else if( $(this).data('function') == 'delete' ) {
    }
    hideActionPanels();
});

function hideActionPanels() {
    $(".osel-overflow-menu .layer-overflow").removeClass('active').css({ 'top': -9999, 'left': -9999 });
}


/*
 * Tooltips
 */
 $(".no-touch ul.layers .layer-element div[class*='label-']:not(.expander)").hover(
    function() {
        var elem = $(this);
        if( elem[0].offsetWidth < elem[0].scrollWidth )
            $('<div/>', { class: 'osel-tooltip', text: elem.text() }).css({ 'top': elem.offset().top + 'px' }).appendTo('body');
    },
    function() {
        $(document.body).find('.osel-tooltip').remove();
    }
);


/*
 * Dropdown
 */
$(".osel-dropdown .select").click(function() {
    $(this).toggleClass('active').children('i').toggleText('keyboard_arrow_up', 'keyboard_arrow_down');
    $(this).parent().children('.options').toggleClass('hidden');
});

$(".osel-dropdown .options div").click(function() {
    var val = $(this).data('value'),
        txt = $(this).children('span').text();

    $(".osel-dropdown .options div").removeClass('selected').children('i').empty();
    $(this).addClass('selected').children('i').html('done');

    $(this).parent().toggleClass('hidden');

    var select = $(this).parents().children('.select');
    select.removeClass('active');
    select.children('span').text(txt);
    select.children('i').text('keyboard_arrow_down');

    // filterLayer(val);
});


/*
 * Switch view
 */
$(".osel-widget-switch-view .osel-toggle-button").click(function() {
    $(this).parent().children().removeClass('active');
    $(this).toggleClass('active');

    var id = $(this).attr('id');
    if( id == 'view-map' ) {
        $("#map").removeClass('hidden');
        $("#stats").addClass('hidden');
    }
    else if( id == 'view-stats' ) {
        $("#map").addClass('hidden');
        $("#stats").removeClass('hidden');
    }

    $(".osel-control-container .action-button").removeClass('selected');
    $(".osel-control-container .panel").css({ 'bottom': -9999, 'right': -9999 });
});


/*
 * Action button
 */
$(".osel-control-container .action-button").click(function() {
    $(".osel-control-container").find('.center-control .panel, .basemap-control .panel').css({ 'bottom': -9999, 'right': -9999 });

    var elem = $(this);
    var offset = elem.offset();

    var top = offset.top;
    var bottom = $(window).height() - elem.height();
    bottom -= offset.top;

    // var left = offset.left;
    // var right = $(window).width() - elem.width();
    // right -= offset.left;

    if( elem.parent().hasClass('center-control') ) {
        $(".osel-control-container .basemap-control .action-button").removeClass('selected');
        $(".osel-map-crosshair").toggleClass('hidden');
    }
    else if( elem.parent().hasClass('basemap-control') ) {
        $(".osel-control-container .center-control .action-button").removeClass('selected');
        $(".osel-map-crosshair").addClass('hidden');
    }

    elem.toggleClass('selected');

    if( elem.hasClass('selected') )
        elem.parent().children('.panel').css({ 'bottom': bottom, 'right': 94 });
});


/*
 * Basemap control
 */
$(".osel-control-container .basemap-control .list-select .list-item [data-style='" + defaults.basemapStyle + "']").addClass('active');

$(".no-touch .osel-control-container .basemap-control .list-select .list-item").hover(
    function() {
        $(this).children('div').addClass('rollover');
    },
    function() {
        $(this).children('div').removeClass('rollover');
    }
);

$(".osel-control-container .basemap-control .list-select .list-item").click(function() {
    var activeStyle = $(".osel-control-container .basemap-control .list-select .list-item .active").data('style'),
        style = $(this).children('div').data('style');

    if( activeStyle == style )
        return;

    switchBasemap(style);
    $(this).parent().children('.list-item').children('div').removeClass('active');
    $(this).children('div').addClass('active');
    $(this).children('div').removeClass('rollover');
});


/*
 * Legend control
 */
$(".osel-control-container .legend-control .widget .panel-expand i").click(function() {
    $(this).toggleText('keyboard_arrow_up', 'keyboard_arrow_down');
    $(this).parents('.legend-control').children('.panel').toggleClass('hidden');
});
