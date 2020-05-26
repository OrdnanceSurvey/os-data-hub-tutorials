var search = {
    //
    init: function() {
        if( localStorage.getItem('searchLocationHistory') === null )
            localStorage.setItem('searchLocationHistory', '');

        $(".osel-search-control form").submit(function(e){
            e.preventDefault();
            $(this).find('input').blur();
        });

        $(".osel-search-control form input")
            .on('change keyup paste', function() {
            })
            .on('focus', function() {
                $(".osel-search-control, .osel-search-control form").addClass('active');
            })
            .on('blur', function() {
                $(".osel-search-control, .osel-search-control form").removeClass('active');
            })
            .devbridgeAutocomplete({
                /* Ajax only settings */
                // serviceUrl: 'http://localhost:8888/api/opennames/v3/search',
                serviceUrl: 'https://labs.os.uk/api/opennames/v3/search',
                dataType: 'json',
                params: {
                    maxresults: 10
                },
                /* General settings (local and Ajax) */
                noCache: true,
                minChars: 0,
                // deferRequestBy: 200,
                triggerSelectOnValidInput: false,
                preventBadQueries: false,
                autoSelectFirst: true,
                beforeRender: function(container, suggestions) {
                    if( suggestions.length == 1 && suggestions[0].value == '' ) {
                        var res = search.getSearchLocationHistory(),
                            str = '';
                        for( var i = 0; i < res.length; i++ ) {
                            str += '<div class="autocomplete-suggestion" data-index="' + i + '"><i class="material-icons">' + search.getTypeIcon(res[i].data.type) + '</i>' + res[i].value + '</div>';
                        };
                        container.html(str);
                        Array.prototype.push.apply(suggestions, res);
                        suggestions.shift();
                    }
                },
                formatResult: function(suggestion, currentValue) {
                    if(! currentValue ) {
                        return suggestion.value;
                    }
                    var pattern = '(' + currentValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + ')';
                    return '<i class="material-icons">' + search.getTypeIcon(suggestion.data.type) + '</i>' + suggestion.value
                        .replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>')
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/&lt;(\/?strong)&gt;/g, '<$1>');
                },
                maxHeight: 294,
                width: $(".osel-search-control").width(),
                showNoSuggestionNotice: true,
                noSuggestionNotice: 'No results, please try again',
                /* Event function settings (local and Ajax) */
                transformResult: function(response) {
                    if( $(this)[0].params.query === '' ) {
                        response.results = [{
                            value: '', type: '', longitude: 0, latitude: 0
                        }];
                    }
                    return {
                        suggestions: $.map(response.results, function(dataItem) {
                            return {
                                value: dataItem.value,
                                data: {
                                    id: dataItem.id,
                                    type: dataItem.type,
                                    lon: dataItem.longitude,
                                    lat: dataItem.latitude,
                                    bbox: dataItem.bbox
                                }
                            };
                        })
                    };
                },
                onSelect: function(suggestion) {
                    if( suggestion.data.bbox != null ) {
                        if( isLeaflet )
                            map.fitBounds([
                                [ suggestion.data.bbox[0], suggestion.data.bbox[1] ],
                                [ suggestion.data.bbox[2], suggestion.data.bbox[3] ]
                            ]);
                        else if( isMapboxGL )
                            map.fitBounds([
                                [ suggestion.data.bbox[1], suggestion.data.bbox[0] ],
                                [ suggestion.data.bbox[3], suggestion.data.bbox[2] ]
                            ], { animate: false });
                    }
                    else {
                        if( isLeaflet )
                            map.setView([ suggestion.data.lat, suggestion.data.lon ], 16);
                        else if( isMapboxGL )
                            map.easeTo({ center: [ suggestion.data.lon, suggestion.data.lat ], zoom: 16 });
                    }
                    search.setSearchLocationHistory(suggestion);
                    $(this).blur();

                    // show addClear close icon
                    $(this).parent().children('a').css({ 'display': 'block' });
                }
            })
            .addClear({
                closeSymbol: '<i class="material-icons">close</i>',
                top: -2,
                right: 0,
                returnFocus: false
            });
    },
    //
    getTypeIcon: function(type) {
        switch (type) {
            case 7:
            case 8:
                return 'directions_car';
            case 9:
                return 'directions_railway';
            case 98:
                return 'add';
            case 99:
                return 'apps';
            default:
                return 'place';
        }
    },
    //
    getSearchLocationHistory: function() {
        var str = localStorage.getItem('searchLocationHistory');
        return str == '' ? [] : JSON.parse(str);
    },
    //
    setSearchLocationHistory: function(suggestion) {
        var res = search.getSearchLocationHistory(),
            data = { 'value': suggestion.value, 'data': suggestion.data };

        for( var i = 0; i < res.length; i++ ) {
            if( res[i].data.id === suggestion.data.id ) {
                res.splice(i, 1);
                break;
            }
        }

        res.unshift(data);
        res.length = res.length < 3 ? res.length : 3;

        localStorage.setItem('searchLocationHistory', JSON.stringify(res));
    }
}

search.init();
