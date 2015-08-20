require.config( {

    paths: {
        'jquery': 'https://code.jquery.com/jquery-1.11.3',

        'underscore': 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore',
        'backbone': 'https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.2.1/backbone',
        'marionette': 'https://cdnjs.cloudflare.com/ajax/libs/backbone.marionette/2.4.2/backbone.marionette',
        'backbone.marionette.export': 'https://cdn.rawgit.com/hashchange/backbone.marionette.export/2.1.4/dist/amd/backbone.marionette.export'
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
