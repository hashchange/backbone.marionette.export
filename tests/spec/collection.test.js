/*global describe, it */
'use strict';

(function () {

    var it_accepts = it,
        it_throws_an_error = it,
        it_acts_recursively = it;

    // Detect the ability to create deep clones with the utility library (Lo-dash build with _.cloneDeep support vs
    // Underscore), and make test execution dependent on it for affected tests.
    var withCloneDeep_it_acts_recursively = ( _.cloneDeep ? it : it.skip );     // Lo-dash build with cloneDeep support

    describe( 'A Backbone collection is enhanced with the export functionality.', function () {

        beforeEach( function () {

             this.models = [
                new Backbone.Model ( { modelProp: 1 } ),
                new Backbone.Model ( { modelProp: 2 } ),
                new Backbone.Model ( { modelProp: 3 } )
            ];

            var ModelWithExportedMethods = Backbone.Model.extend( {
                exportable: "method",
                method: function () { return "returning a value"; }
            } );

            this.modelsWithExportedMethods = [
                new ModelWithExportedMethods( { modelProp: 1 } ),
                new ModelWithExportedMethods( { modelProp: 2 } ),
                new ModelWithExportedMethods( { modelProp: 3 } )
            ];

            this.CollectionWithMethods = Backbone.Collection.extend( {
                method: function () { return "collection method, returning a value"; }
            } );

        });

        describe( 'By default, export()', function () {

            it( 'returns an array of exported model hashes', function () {

                var collection = new Backbone.Collection( this.modelsWithExportedMethods );

                var exportedModels = _.map( this.modelsWithExportedMethods, function ( model ) { return model.export(); } );
                collection.export().should.deep.equal( exportedModels );

            } );

            it( 'calls the export() method of each model in the array', function () {

                // Add a spy to the export() method of each model
                _.each( this.models, function ( model ) { sinon.spy( model, "export" ); } );

                var collection = new Backbone.Collection( this.models );
                collection.export();

                _.each( this.models, function ( model ) {
                    model.export.should.have.been.calledOnce;
                } );

                // Remove the spy
                _.each( this.models, function ( model ) { model.export.restore(); } );

            } );

            it( 'returns an empty array if the collection does not hold any models', function () {

                var collection = new Backbone.Collection();
                collection.export().should.deep.equal( [] );

            } );

            it( 'does not call any method on the collection itself', function () {

                var collectionWithMethods = new this.CollectionWithMethods( this.models );
                sinon.spy( collectionWithMethods, "method" );

                collectionWithMethods.export();
                collectionWithMethods.method.should.not.have.been.called;

            } );

            it( 'returns identical results with and without custom methods having been added to the collection', function () {

                var collectionWithMethods = new this.CollectionWithMethods( this.modelsWithExportedMethods );
                var plainCollection       = new Backbone.Collection( this.modelsWithExportedMethods );

                collectionWithMethods.export().should.deep.equal( plainCollection.export() );

            } );

        } );

        describe( 'The "exportable" property stores the methods which are called on export.', function () {

            describe( 'It accepts', function () {

                it_accepts( 'a string with the name of the method. export() evaluates the method and returns it as a property', function () {

                    var Collection = this.CollectionWithMethods.extend( { exportable: "method" } );
                    var collection = new Collection( this.models );

                    collection.export().should.have.a.property( 'method' ).with.a.string( "collection method, returning a value" );

                } );

                it_accepts( 'a string in the format "this.method". export() evaluates the method and returns it as a property', function () {

                    var Collection = this.CollectionWithMethods.extend( { exportable: "this.method" } );
                    var collection = new Collection( this.models );

                    collection.export().should.have.a.property( 'method' ).with.a.string( "collection method, returning a value" );

                } );

                it_accepts( 'an array of method names. export() evaluates all of them and returns them as properties', function () {

                    var Collection = this.CollectionWithMethods.extend( {
                        exportable: [ "method", "this.anotherMethod" ],
                        anotherMethod: function () { return "another collection method, returning a value"; }
                    } );
                    var collection = new Collection( this.models );

                    collection.export().should.have.a.property( 'method' ).with.a.string( "collection method, returning a value" );
                    collection.export().should.have.a.property( 'anotherMethod' ).with.a.string( "another collection method, returning a value" );

                } );

            } );

            describe( 'It causes an error on export()', function () {

                it_throws_an_error( 'when being assigned a method reference', function () {

                    var Collection = this.CollectionWithMethods.extend( {
                        initialize: function () { this.exportable = [ this.method ]; }
                    } );
                    var collection = new Collection( this.models );

                    var exportFunction = _.bind( collection.export, collection );
                    exportFunction.should.throw( Error, "'exportable' property: Invalid method identifier" );

                } );

                it_throws_an_error( 'when one of the methods doesn\'t exist', function () {


                    var Collection = this.CollectionWithMethods.extend( { exportable: "missing" } );
                    var collection = new Collection( this.models );

                    var exportFunction = _.bind( collection.export, collection );

                    exportFunction.should.throw( Error, "Can't export \"missing\". The method doesn't exist" );

                } );

                it_throws_an_error( 'if an exported collection method would overwrite a native array property', function () {

                    var Collection = Backbone.Collection.extend( {
                        exportable: "join",
                        join: function () { return "foo"; }
                    } );
                    var collection = new Collection( this.models );

                    var exportFunction = _.bind( collection.export, collection );

                    exportFunction.should.throw( Error, "Can't export a property with a name which is reserved for a native array property. Offending properties: join" );

                } );

            } );

            describe( 'It', function () {

                it( 'also handles and exports ordinary properties of the collection, not just methods', function () {

                    var Collection = Backbone.Collection.extend( {
                        exportable: "property",
                        property: "ordinary property value, not the result of a method call"
                    } );
                    var collection = new Collection();

                    collection.export().should.have.a.property( 'property' ).with.a.string( "ordinary property value, not the result of a method call" );

                } );

                it( 'does not change how the models in the collection are returned: as an array of export()ed model hashes', function () {

                    var Collection = this.CollectionWithMethods.extend( { exportable: "method" } );
                    var collection = new Collection( this.modelsWithExportedMethods );

                    var expectedModelHashes = _.map( this.modelsWithExportedMethods, function( model ) { return model.export(); } );
                    var exportedModelHashes = _.map( collection.export(), function( modelHash ) {return modelHash; } );
                    exportedModelHashes.should.deep.equal( expectedModelHashes );

                } );

            } );

            describe( 'It calls export() recursively', function () {

                var OuterCollection, InnerModel, innerModel, innerModel_expectedExport,
                    InnerCollection, innerCollection, innerCollection_expectedExport,
                    deeplyNestedModel, deeplyNestedModel_ExpectedExport,
                    deeplyNestedCollection, deeplyNestedCollection_expectedExport,
                    getOuterCollection;

                beforeEach( function () {

                    OuterCollection = Backbone.Collection.extend( {
                        returnsInner: function () { return this.propWithInnerObject; },
                        propWithInnerObject: undefined,
                        setInnerObject: function ( innerObject ) { this.propWithInnerObject = innerObject; }
                    } );

                    getOuterCollection = function ( opts ) {
                        var Outer = OuterCollection.extend( opts );
                        return new Outer();
                    };

                    InnerModel = this.ModelWithMethod.extend( { exportable: "method" } );
                    innerModel = new InnerModel();
                    innerModel_expectedExport = innerModel.export();

                    InnerCollection = Backbone.Collection.extend( {
                        exportable: "method",
                        method: function() { return "returned by method of inner collection"; }
                    } );
                    innerCollection = new InnerCollection();
                    innerCollection_expectedExport = innerCollection.export();

                    deeplyNestedModel                 = { levelOneProp: [ 1, { nestedHere: innerModel          }, 3 ] };
                    deeplyNestedModel_ExpectedExport  = { levelOneProp: [ 1, { nestedHere: innerModel.export() }, 3 ] };

                    // NB deeplyNestedCollection: is a _model_, with a deeply nested collection inside
                    deeplyNestedCollection                = { levelOneProp: [ 1, { nestedHere: innerCollection          }, 3 ] };
                    deeplyNestedCollection_expectedExport = { levelOneProp: [ 1, { nestedHere: innerCollection.export() }, 3 ] };

                    sinon.spy( innerModel, "export" );
                    sinon.spy( innerCollection, "export" );

                });

                afterEach( function () {
                    if ( innerModel.export.restore ) innerModel.export.restore();
                    if ( innerCollection.export.restore ) innerCollection.export.restore();
                });


                it_acts_recursively( 'on models which are returned by an exported collection method', function () {

                    var collection = getOuterCollection( { exportable: "returnsInner" } );
                    collection.setInnerObject( innerModel );

                    var exported = collection.export();

                    var expectedArr = [];
                    expectedArr.returnsInner = innerModel_expectedExport;

                    innerModel.export.should.have.been.calledOnce;
                    exported.should.be.deep.equal( expectedArr );
                } );

                it_acts_recursively( 'on inner, nested collections which are returned by an exported collection method', function () {

                    var collection = getOuterCollection( { exportable: "returnsInner" } );
                    collection.setInnerObject( innerCollection );

                    var exported = collection.export();

                    var expectedArr = [];
                    expectedArr.returnsInner = innerCollection_expectedExport;

                    innerCollection.export.should.have.been.calledOnce;
                    exported.should.be.deep.equal( expectedArr );

                } );

                it_acts_recursively( 'on models which are assigned to an exported collection property', function () {

                    var collection = getOuterCollection( { exportable: "propWithInnerObject" } );
                    collection.setInnerObject( innerModel );

                    var exported = collection.export();

                    var expectedArr = [];
                    expectedArr.propWithInnerObject = innerModel_expectedExport;

                    innerModel.export.should.have.been.calledOnce;
                    exported.should.be.deep.equal( expectedArr );

                } );

                it_acts_recursively( 'on inner, nested collections which are assigned to an exported collection property', function () {

                    var collection = getOuterCollection( { exportable: "propWithInnerObject" } );
                    collection.setInnerObject( innerCollection );

                    var exported = collection.export();

                    var expectedArr = [];
                    expectedArr.propWithInnerObject = innerCollection_expectedExport;

                    innerCollection.export.should.have.been.calledOnce;
                    exported.should.be.deep.equal( expectedArr );

                } );

                withCloneDeep_it_acts_recursively( '[+ _.cloneDeep] on inner models, deeply nested within other structures and returned by an exported method', function () {

                    var collection = getOuterCollection( { exportable: "returnsInner" } );
                    collection.setInnerObject( deeplyNestedModel );

                    var exported = collection.export();

                    var expectedArr = [];
                    expectedArr.returnsInner = deeplyNestedModel_ExpectedExport;

                    innerModel.export.should.have.been.calledOnce;
                    exported.should.be.deep.equal( expectedArr );

                } );

                withCloneDeep_it_acts_recursively( '[+ _.cloneDeep] on inner collections, deeply nested within other structures and returned by an exported method', function () {

                    var collection = getOuterCollection( { exportable: "returnsInner" } );
                    collection.setInnerObject( deeplyNestedCollection );

                    var exported = collection.export();

                    var expectedArr = [];
                    expectedArr.returnsInner = deeplyNestedCollection_expectedExport;

                    innerCollection.export.should.have.been.calledOnce;
                    exported.should.be.deep.equal( expectedArr );

                } );

                withCloneDeep_it_acts_recursively( '[+ _.cloneDeep] on inner models, deeply nested within other structures and assigned to an exported property', function () {

                    var collection = getOuterCollection( { exportable: "propWithInnerObject" } );
                    collection.setInnerObject( deeplyNestedModel );

                    var exported = collection.export();

                    var expectedArr = [];
                    expectedArr.propWithInnerObject = deeplyNestedModel_ExpectedExport;

                    innerModel.export.should.have.been.calledOnce;
                    exported.should.be.deep.equal( expectedArr );

                } );

                withCloneDeep_it_acts_recursively( '[+ _.cloneDeep] on inner collections, deeply nested within other structures and assigned to an exported property', function () {

                    var collection = getOuterCollection( { exportable: "propWithInnerObject" } );
                    collection.setInnerObject( deeplyNestedCollection );

                    var exported = collection.export();

                    var expectedArr = [];
                    expectedArr.propWithInnerObject = deeplyNestedCollection_expectedExport;

                    innerCollection.export.should.have.been.calledOnce;
                    exported.should.be.deep.equal( expectedArr );

                } );

                it_acts_recursively( 'up to the maximum recursion depth, controlling circular dependencies', function () {

                    var Collection = Backbone.Collection.extend({
                        exportable: "next",
                        _next: undefined,
                        setNext: function ( next ) { this._next = next },
                        next: function () { return this._next }
                    });

                    var collection1 = new Collection();
                    var collection2 = new Collection();

                    sinon.spy( collection1, "export" );
                    sinon.spy( collection2, "export" );

                    collection1.setNext( collection2 );
                    collection2.setNext( collection1 );

                    collection1.export();

                    // Recursion depth of export calls (hops). Equals call count  - 1 (the initial export call is not a
                    // hop).
                    var hops = collection1.export.callCount + collection2.export.callCount - 1;

                    hops.should.equal( Collection.prototype.export.maxHops );

                } );

            } );

        } );

        describe( 'The onExport() handler', function () {

            it( 'is run by export(). It receives an array of model hashes - the data designated for export - as an argument', function () {

                var collection = new Backbone.Collection( this.modelsWithExportedMethods );
                sinon.spy( collection, "onExport" );

                var exportedModels = _.map( this.modelsWithExportedMethods, function( model ) { return model.export(); } );

                collection.export();
                collection.onExport.should.have.been.calledWithExactly( exportedModels );

            } );

            it( 'receives the array last. Ie, the methods of the collection which are marked as "exportable" have already been transformed into properties of the array', function () {

                var Collection = this.CollectionWithMethods.extend( { exportable: "method" } );
                var collection = new Collection( [] );
                sinon.spy( collection, "onExport" );

                var expected = [];
                expected.method = "collection method, returning a value";

                collection.export();
                collection.onExport.should.have.been.calledWithExactly( expected );

            } );

            it( 'is able to alter the data before it is returned by export()', function () {

                var Collection = Backbone.Collection.extend( {
                    property: "in original state",
                    onExport: function ( data ) {
                        data.property = "in modified state";
                        return data;
                    }
                } );
                var collection = new Collection();

                collection.export().should.have.a.property( 'property' ).with.a.string( "in modified state" );

            } );

            it( 'does not allow to overwrite a native array property and throws an error', function () {

                var Collection = Backbone.Collection.extend( {
                    onExport: function ( data ) {
                        data.join = "foo";
                        data.concat = "bar";
                        return data;
                    }
                } );
                var collection = new Collection( this.models );

                var exportFunction = _.bind( collection.export, collection );

                exportFunction.should.throw( Error, "Can't export a property with a name which is reserved for a native array property. Offending properties: join" );

            } );

        } );

        describe( 'The onBeforeExport() handler', function () {

            it( 'is run when export() is called', function () {

                var collection = new Backbone.Collection();
                sinon.spy( collection, "onBeforeExport" );

                collection.export();
                collection.onBeforeExport.should.have.been.calledOnce;

            } );

            it( 'can modify the collection state before it is turned into a hash', function () {

                var traceMe =  new Backbone.Model( { traceMe: true } );

                var Collection = Backbone.Collection.extend( {
                    onBeforeExport: function () {
                        this.add( traceMe );
                    }
                } );
                var collection = new Collection();

                collection.export().should.be.deep.equal( [ traceMe.export() ] );

            } );

            it( 'can manipulate other, "exportable" collection methods before they are transformed and added to the hash', function () {

                var Collection = Backbone.Collection.extend( {
                    exportable: "method",
                    onBeforeExport: function () {
                        this.method = function () { return "manipulated method return value"; }
                    },
                    method: function () { return "original method return value"; }
                } );
                var collection = new Collection();

                collection.export().should.have.a.property( 'method' ).with.a.string( "manipulated method return value" );

            } );

            it( 'alters the collection state permanently, beyond the export() call', function () {

                var traceMe =  new Backbone.Model( { traceMe: true } );

                var Collection = Backbone.Collection.extend( {
                    onBeforeExport: function () {
                        this.add( traceMe );
                    }
                } );
                var collection = new Collection();

                collection.export();
                collection.at( 0 ).should.be.deep.equal( traceMe );

            } );

            it( 'runs before onExport()', function () {

                var collection = new Backbone.Collection();
                sinon.spy( collection, "onBeforeExport" );
                sinon.spy( collection, "onExport" );

                collection.export();
                collection.onBeforeExport.should.have.been.calledBefore( collection.onExport );

            } );

        } );

        describe( 'The onAfterExport() handler', function () {

            it( 'is run when export() is called', function () {

                var collection = new Backbone.Collection();
                sinon.spy( collection, "onAfterExport" );

                collection.export();
                collection.onAfterExport.should.have.been.calledOnce;

            } );

            it( 'can act on the model state after it has been turned into a hash, leaving the exported hash unchanged', function () {

                var traceMe = new Backbone.Model( { traceMe: true } );

                var Collection = Backbone.Collection.extend( {
                    onAfterExport: function () {
                        this.add( traceMe );
                    }
                } );
                var collection = new Collection();

                collection.export().should.be.deep.equal( [] );
                collection.at( 0 ).should.be.deep.equal( traceMe );

            } );

            it( 'can manipulate other, "exportable" collection methods only after they have been transformed and added to the hash', function () {

                var Collection = Backbone.Collection.extend( {
                    exportable: "method",
                    onAfterExport: function () {
                        this.method = function () { return "manipulated method return value"; }
                    },
                    method: function () { return "original method return value"; }
                } );
                var collection = new Collection();

                collection.export().should.have.a.property( 'method' ).with.a.string( "original method return value" );
                collection.method().should.be.a.string( "manipulated method return value" );

            } );

            it( 'runs after onExport()', function () {

                var collection = new Backbone.Collection();
                sinon.spy( collection, "onAfterExport" );
                sinon.spy( collection, "onExport" );

                collection.export();
                collection.onAfterExport.should.have.been.calledAfter( collection.onExport );

            } );

        } );

    } );

})();
