requirejs.config( {

    // Base URL: project root
    baseUrl: "../../",

    paths: {
        // Using a different jQuery here than elsewhere: 1.x, instead of 2.x (in bower_demo_components) or 3.x
        // (in bower_components). Makes the demo work in oldIE, too.

        "jquery-legacy-v1": "demo/bower_demo_components/jquery-legacy-v1/dist/jquery",
        "jquery-legacy-v2": "demo/bower_demo_components/jquery-legacy-v2/dist/jquery",
        "jquery-modern": "bower_components/jquery/dist/jquery",

        "underscore": "bower_components/underscore/underscore",
        "backbone": "bower_components/backbone/backbone",
        "backbone.radio": "bower_components/backbone.radio/build/backbone.radio",
        "marionette-modern": "bower_components/marionette/lib/backbone.marionette",
        "marionette-legacy": "bower_components/marionette-legacy/lib/backbone.marionette",

        "backbone.marionette.export": "dist/backbone.marionette.export",

        "local.main": "demo/amd/main"
    },

    map: {
        "*": {
            // Using legacy versions here: jQuery 1, Marionette 2. Makes the demo work in legacy browsers.
            "jquery": "jquery-legacy-v1",
            "marionette": "marionette-legacy"
        }
    },

    shim: {
        "jquery-legacy-v1": {
            exports: "jQuery"
        },
        "jquery-legacy-v2": {
            exports: "jQuery"
        },
        "jquery-modern": {
            exports: "jQuery"
        },

        "backbone.marionette.export": ["marionette"]
    }
} );

