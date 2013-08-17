/* Tests for Marionette.ItemView */
'use strict';
(function () {

    describe( 'Marionette.ItemView automatically provides the output of export() to its template.', function () {

        beforeEach( function () {

            this.ItemView = Marionette.ItemView.extend( {
                template: function ( injectedData ) {
                    return _.template( 'some template HTML', injectedData );
                }
            } );

        } );

        describe( 'When ItemView handles a Backbone model, the render() method of the view', function () {
            
            it( 'invokes the export() method of the model', function () {

                var Model = Backbone.Model.extend( {} );
                var model = new Model();
                var itemView = new this.ItemView( { model: model } );
                sinon.spy( model, "onExport" );

                itemView.render();
                model.onExport.should.have.been.calledOnce;

            } );

            it( 'makes the exported data available to the template', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    method: function () { return "a method return value"; }
                } );
                var model = new Model();
                var itemView = new this.ItemView( { model: model } );
                sinon.spy( itemView, "template" );

                var exportedModel = model.export();
                itemView.render();
                itemView.template.should.have.been.calledWithExactly( exportedModel );

            } );

        } );

        describe( 'When ItemView handles a Backbone collection, the render() method of the view', function () {

            it( 'invokes the export() method of the collection', function () {

                var Collection = Backbone.Collection.extend( {} );
                var collection = new Collection();
                var itemView = new this.ItemView( { collection: collection } );
                sinon.spy( collection, "onExport" );

                itemView.render();
                collection.onExport.should.have.been.calledOnce;

            } );

            it( 'makes the exported methods and properties of the collection available to the template, as top-level properties of the data', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    method: function () { return "a method return value, model cid = " + this.cid; }
                } );

                var Collection = Backbone.Collection.extend( {
                    exportable: "collectionMethod",
                    collectionMethod: function () { return "a return value from a collection method"; }
                } );
                var collection = new Collection( [ new Model(), new Model(), new Model() ] );

                var itemView = new this.ItemView( { collection: collection } );
                sinon.spy( itemView, "template" );

                itemView.render();

                itemView.template.should.have.been.calledWithExactly( sinon.match.has("collectionMethod", "a return value from a collection method" ) );

            } );

            it( 'makes the exported methods and properties of the collection available to the template in an "items.meta" property', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    method: function () { return "a method return value, model cid = " + this.cid; }
                } );

                var Collection = Backbone.Collection.extend( {
                    exportable: "collectionMethod",
                    collectionMethod: function () { return "a return value from a collection method"; }
                } );
                var collection = new Collection( [ new Model(), new Model(), new Model() ] );

                var itemView = new this.ItemView( { collection: collection } );
                sinon.spy( itemView, "template" );

                itemView.render();
                itemView.template.should.have.been.calledWithExactly( sinon.match( function ( templateData ) {
                    return templateData.items && templateData.items.meta && _.isEqual( templateData.items.meta, collection.export().meta );
                } ) );

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

                var itemView = new this.ItemView( { collection: collection } );
                sinon.spy( itemView, "template" );

                itemView.render();
                itemView.template.should.have.been.calledWithExactly( sinon.match.has( "items", collection.export() ) );
                //
                // NB: sinon.match.has does compare the array, but does NOT pick up any custom properties attached to
                // the array object. Here, we only verify that the content of the arrays, ie the items in it, are
                // identical. We can't verify full equality for the array objects this way.
                // See https://github.com/cjohansen/Sinon.JS/issues/315

            } );

         } );

    } );

})();
