requirejs.config( {

    baseUrl: '../../bower_components',

    paths: {
        'jquery': '../node_modules/jquery/dist/jquery',
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
        }
    }
} );

require( [

    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'backbone.marionette.export'

], function ( $, _, Backbone ) {

    var Model = Backbone.Model.extend( {
            exportable: "someMethod",

            onExport: function ( data ) {
                data || (data = {});
                data.someMethodWithArgs = this.someMethodWithArgs( this.cid );
                return data;
            },
            someMethod: function () {
                return "This is the return value of a method call on model <code>" + this.id + "</code>.";
            },
            someMethodWithArgs: function ( arg ) {
                return "This is the return value of a method call with argument <code>" + arg + "</code> on model <code>" + this.id + "</code>.";
            }
        } ),

        Collection = Backbone.Collection.extend( {
            exportable: [ "first", "last" ]
        } ),

        m1 = new Model( { id: 1  } ),
        m2 = new Model( { id: 2  } ),
        m3 = new Model( { id: 3  } ),

        collection = new Collection( [ m1, m2, m3 ] ),

        DataView = Backbone.Marionette.CompositeView.extend( {
            childView: Backbone.Marionette.ItemView.extend( {
                tagName: "li",
                template: "#model-template"
            } ),
            childViewContainer: "ul",
            template: "#collection-template"
        } ),

        dataRegion = new Backbone.Marionette.Region( {
            el: "#main"
        } );

    dataRegion.show( new DataView( { collection: collection } ) );
} );
