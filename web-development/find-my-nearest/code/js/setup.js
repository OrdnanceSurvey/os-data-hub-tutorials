var notification = {
  //
  init: function () {
    $(document.body).on("click", ".osel-notification-close", function () {
      $(this).parent().remove();
    });
  },
  //
  show: function (type, content, fadeOut = true) {
    var id = Date.now();

    var notification =
      '\
            <div class="osel-toast-notification ' +
      type +
      '" data-id="' +
      id +
      '">\
                <div class="osel-notification-icon"></div>\
                <div class="osel-notification-text">' +
      content +
      '</div>\
                <div class="osel-notification-close"><i class="material-icons" aria-label="Close message">close</i></div>\
            </div>\
        ';

    var parent = $(".osel-notification-holder").length
      ? $(".osel-notification-holder")
      : $(document.body);
    parent.append(notification);

    if (fadeOut) {
      setTimeout(function () {
        $(".osel-toast-notification[data-id='" + id + "']").fadeOut(
          function () {
            $(this).remove();
          }
        );
      }, 3000);
    }
  },
  //
  remove: function () {
    $(".osel-toast-notification").remove();
  }
};

notification.init();
