/*global describe, it */
(function () {
    "use strict";

    describe( 'Marionette.CompositeView automatically provides the output of export() to its template.', function () {

        var CompositeView, Model, model, Collection, collection;

        beforeEach( function () {

            CompositeView = Marionette.CompositeView.extend( {
                template: function ( injectedData ) {
                    return _.template( 'some template HTML', injectedData );
                }
            } );

            Model = Backbone.Model.extend( {
                exportable: "method",
                method: function () { return "a method return value, model cid = " + this.cid; }
            } );
            model = new Model();

            Collection = Backbone.Collection.extend( {
                exportable: "collectionMethod",
                collectionMethod: function () { return "a return value from a collection method"; }
            } );
            collection = new Collection( [ new Model(), new Model(), new Model() ] );

            sinon.spy( model, "export" );
            sinon.spy( collection, "export" );

        } );

        afterEach( function () {

            if ( model["export"].restore ) model["export"].restore();
            if ( collection["export"].restore ) collection["export"].restore();

        } );

        describe( 'When CompositeView handles a Backbone model, the render() method of the view', function () {
            
            it( 'invokes the export() method of the model', function () {

                var compositeView = new CompositeView( { model: model } );

                compositeView.render();
                expect( model["export"] ).to.have.been.calledOnce;

            } );

            it( 'makes the exported data available to the template', function () {

                var compositeView = new CompositeView( { model: model } );
                sinon.spy( compositeView, "template" );

                var exportedModel = model["export"]();
                compositeView.render();
                expect( compositeView.template ).to.have.been.calledWithExactly( exportedModel );

            } );

        } );

        describe( 'When CompositeView handles a Backbone collection, the render() method of the view', function () {

            it( 'invokes the export() method of the collection', function () {

                var compositeView = new CompositeView( { collection: collection } );

                compositeView.render();
                expect( collection["export"] ).to.have.been.calledOnce;

            } );

            it( 'makes the exported methods and properties of the collection available to the template as properties of the "items" array', function () {

                var compositeView = new CompositeView( { collection: collection } );
                sinon.spy( compositeView, "template" );

                compositeView.render();
                expect( compositeView.template ).to.have.been.calledWithExactly( sinon.match( function ( templateData ) {
                    return templateData.items && _.isEqual( _.pairs( templateData.items ), _.pairs( collection["export"]() ) );
                } ) );
                //
                // NB: _.isEqual does compare arrays, but does NOT pick up any custom properties attached to the array
                // objects. That appears to be on purpose, see http://goo.gl/R3WlXu . The docs talk about "an optimized
                // deep comparison". To work around it, we convert the arrays into key-value hashes with _.pairs first,
                // and then compare those hashes.

            } );

            it( 'makes the collection array available to the template in an "items" property', function () {

                var compositeView = new CompositeView( { collection: collection } );
                sinon.spy( compositeView, "template" );

                compositeView.render();
                expect( compositeView.template ).to.have.been.calledWithExactly( sinon.match.has( "items", collection["export"]() ) );
                //
                // NB: sinon.match.has does compare the array, but does NOT pick up any custom properties attached to
                // the array object. Here, we only verify that the content of the arrays, ie the items in it, are
                // identical. We can't verify full equality for the array objects this way - until the patch for it has
                // landed in a Sinon release. See https://github.com/cjohansen/Sinon.JS/issues/315

            } );

         } );

    } );

})();
