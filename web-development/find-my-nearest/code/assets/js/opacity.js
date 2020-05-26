$(function() {
    var selector = '[data-rangeslider]',
        $inputRange = $(selector);

    function valueOutput(element) {
        var value = element.value,
            output = element.parentNode.getElementsByTagName('output')[0];
        output.innerHTML = value + '%';
    }

    for( var i = $inputRange.length - 1; i >= 0; i-- ) {
        valueOutput($inputRange[i]);
    }

    $(document).on('input', selector, function(e) {
        var layer = $(e.target).parents('.layer-overflow').data('parent-id'),
            value = e.target.value / 100;
        setLayerOpacity(layer, value);

        valueOutput(e.target);
    });

    $inputRange.rangeslider({
        polyfill: false
    });
});
