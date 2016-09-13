requirejs.config( {

    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    //
    // Keep this in sync with the map config in amd/require-config.js
    //
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    map: {
        "*": {
            // Using legacy versions here: jQuery 1, Marionette 2. Makes the demo work in legacy browsers.
            "jquery": "jquery-legacy-v1",
            "marionette": "marionette-legacy"
        }
    }

} );
