

// Add an event listener to handle when the user clicks the 'Find Greenspace' button.
$('#request').on('click', function (e) {
    fetchNearestFeatures(e);
});

// A listener for when a user wants to select a location on map
$('#select-location').on('click', function (e) {

    e.preventDefault();
    $(this).toggleClass('active');
    toggleClickCoordsListener();

})

// And for when they want it automatically detected
$('#use-my-location').on('click', function (e) {
 
    e.preventDefault();
    setUseMyLocation();
});

