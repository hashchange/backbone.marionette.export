/* Tests for Marionette.ItemView */
'use strict';
(function () {

    describe( 'Marionette.ItemView automatically provides the output of export() to its template.', function () {

        var ItemView;

        beforeEach( function () {

            ItemView = Marionette.ItemView.extend( {
                template: function ( injectedData ) {
                    return _.template( 'some template HTML', injectedData );
                }
            } );

        } );

        describe( 'When ItemView handles a Backbone model, the render() method of the view', function () {
            
            it( 'invokes the export() method of the model', function () {

                var Model = Backbone.Model.extend( {} );
                var model = new Model();
                var itemView = new ItemView( { model: model } );
                sinon.spy( model, "export" );

                itemView.render();
                expect( model.export ).to.have.been.calledOnce;

            } );

            it( 'makes the exported data available to the template', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    method: function () { return "a method return value"; }
                } );
                var model = new Model();
                var itemView = new ItemView( { model: model } );
                sinon.spy( itemView, "template" );

                var exportedModel = model.export();
                itemView.render();
                expect( itemView.template ).to.have.been.calledWithExactly( exportedModel );

            } );

        } );

        describe( 'When ItemView handles a Backbone collection, the render() method of the view', function () {

            it( 'invokes the export() method of the collection', function () {

                var Collection = Backbone.Collection.extend( {} );
                var collection = new Collection();
                var itemView = new ItemView( { collection: collection } );
                sinon.spy( collection, "export" );

                itemView.render();
                expect( collection.export ).to.have.been.calledOnce;

            } );

            it( 'makes the exported methods and properties of the collection available to the template as properties of the "items" array', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    method: function () { return "a method return value, model cid = " + this.cid; }
                } );

                var Collection = Backbone.Collection.extend( {
                    exportable: "collectionMethod",
                    collectionMethod: function () { return "a return value from a collection method"; }
                } );
                var collection = new Collection( [ new Model(), new Model(), new Model() ] );

                var itemView = new ItemView( { collection: collection } );
                sinon.spy( itemView, "template" );

                itemView.render();
                expect( itemView.template ).to.have.been.calledWithExactly( sinon.match( function ( templateData ) {
                    return templateData.items && _.isEqual( _.pairs( templateData.items ), _.pairs( collection.export() ) );
                } ) );
                //
                // NB: _.isEqual does compare arrays, but does NOT pick up any custom properties attached to the array
                // objects. That appears to be on purpose, see http://goo.gl/R3WlXu . The docs talk about "an optimized
                // deep comparison". To work around it, we convert the arrays into key-value hashes with _.pairs first,
                // and then compare those hashes.

            } );

            it( 'makes the collection array available to the template in an "items" property', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    method: function () { return "a method return value, model cid = " + this.cid; }
                } );

                var Collection = Backbone.Collection.extend( {
                    exportable: "collectionMethod",
                    collectionMethod: function () { return "a return value from a collection method"; }
                } );
                var collection = new Collection( [ new Model(), new Model(), new Model() ] );

                var itemView = new ItemView( { collection: collection } );
                sinon.spy( itemView, "template" );

                itemView.render();
                expect( itemView.template ).to.have.been.calledWithExactly( sinon.match.has( "items", collection.export() ) );
                //
                // NB: sinon.match.has does compare the array, but does NOT pick up any custom properties attached to
                // the array object. Here, we only verify that the content of the arrays, ie the items in it, are
                // identical. We can't verify full equality for the array objects this way - until the patch for it has
                // landed in a Sinon release. See https://github.com/cjohansen/Sinon.JS/issues/315

            } );

         } );

    } );

})();
