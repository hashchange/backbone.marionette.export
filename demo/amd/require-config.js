requirejs.config( {

    baseUrl: '../../bower_components',

    paths: {
        // Using a different jQuery here than elsewhere: 1.x, instead of 2.x (in bower_demo_components) or 3.x
        // (in bower_components). Makes the demo work in oldIE, too.

        'jquery': '../demo/bower_demo_components/jquery-legacy-v1/dist/jquery',
        // 'jquery': '../demo/bower_demo_components/jquery-legacy-v2/dist/jquery',
        // 'jquery': 'jquery/dist/jquery',

        'underscore': 'underscore/underscore',
        'backbone': 'backbone/backbone',
        'marionette': 'marionette/lib/backbone.marionette',
        'backbone.marionette.export': '/dist/amd/backbone.marionette.export'
    },

    shim: {
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'underscore': {
            exports: '_'
        },
        'marionette' : {
            deps : ['jquery', 'underscore', 'backbone'],
            exports : 'Marionette'
        },
        'backbone.marionette.export': {
            deps: ['marionette']
        }
    }
} );

