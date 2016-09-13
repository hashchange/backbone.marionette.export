// main.js

require( [

    'underscore',
    'backbone',
    'marionette',
    'backbone.marionette.export'

], function ( _, Backbone ) {

    var MarionetteBaseView = Backbone.Marionette.ItemView || Backbone.Marionette.View,    // supporting both Marionette 2 and 3

        Model = Backbone.Model.extend( {
            exportable: "someMethod",

            onExport: function ( data ) {
                data || (data = {});                                                // jshint ignore:line
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
            childView: MarionetteBaseView.extend( {
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

define("local.main", function(){});

