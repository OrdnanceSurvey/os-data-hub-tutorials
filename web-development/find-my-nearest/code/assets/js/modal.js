var modal = {
    //
    init: function() {
        $(document.body).on('click', '.osel-modal-dialogue-close', function() {
            $(this).parents('.osel-modal-overlay').remove();
        });

        $(document.body).on('click', '.osel-modal-dialogue .osel-button', function() {
            $(this).parents('.osel-modal-overlay').remove();
        });
    },
    //
    show: function(obj) {
        var buttons = '';
        if( obj.hasOwnProperty('buttons') ) {
            buttons += '<div class="osel-modal-dialogue-buttons">';
            for( var i = 0; i < obj.buttons.length; i++ ) {
                buttons += '<button class="osel-button osel-' + obj.buttons[i].type + '-button">' + obj.buttons[i].text + '</button>'
            }
            buttons += '</div>';
        }

        var modal = '\
            <div class="osel-modal-overlay">\
                <div class="osel-modal-dialogue">\
                    <div class="osel-modal-dialogue-body">\
                        <div class="osel-modal-dialogue-title">' + obj.title + '</div>\
                        <div class="osel-modal-dialogue-content">' + obj.content + '</div>\
                    </div>\
                    ' + buttons + '\
                    <div class="osel-modal-dialogue-close"><i class="material-icons" aria-label="Close message">close</i></div>\
                </div>\
            </div>\
        ';

        $(document.body).prepend(modal);
    },
    //
    remove: function() {
        $(".osel-modal-dialogue-overlay").remove();
    }
}

modal.init();
