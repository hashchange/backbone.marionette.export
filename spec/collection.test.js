/*global describe, it */
(function () {
    "use strict";

    var it_accepts = it,
        it_throws_an_error = it,
        it_acts_recursively = it;

    // Detect the ability to create deep clones with the utility library (Lo-dash build with _.cloneDeep support vs
    // Underscore), and make test execution dependent on it for affected tests.
    var withCloneDeep_it_acts_recursively = ( _.cloneDeep ? it : it.skip );     // Lo-dash build with cloneDeep support

    describe( 'A Backbone collection is enhanced with the export functionality.', function () {

        var models, modelsWithExportedMethods, CollectionWithMethods;

        beforeEach( function () {

            models = [
                new Backbone.Model ( { modelProp: 1 } ),
                new Backbone.Model ( { modelProp: 2 } ),
                new Backbone.Model ( { modelProp: 3 } )
            ];

            var ModelWithExportedMethods = Backbone.Model.extend( {
                exportable: "method",
                method: function () { return "returning a value"; }
            } );

            modelsWithExportedMethods = [
                new ModelWithExportedMethods( { modelProp: 1 } ),
                new ModelWithExportedMethods( { modelProp: 2 } ),
                new ModelWithExportedMethods( { modelProp: 3 } )
            ];

            CollectionWithMethods = Backbone.Collection.extend( {
                method: function () { return "collection method, returning a value"; }
            } );

        });

        describe( 'By default, export()', function () {

            it( 'returns an array of exported model hashes', function () {

                var collection = new Backbone.Collection( modelsWithExportedMethods );

                var exportedModels = _.map( modelsWithExportedMethods, function ( model ) { return model["export"](); } );
                expect( collection["export"]() ).to.deep.equal( exportedModels );

            } );

            it( 'calls the export() method of each model in the array', function () {

                // Add a spy to the export() method of each model
                _.each( models, function ( model ) { sinon.spy( model, "export" ); } );

                var collection = new Backbone.Collection( models );
                collection["export"]();

                _.each( models, function ( model ) {
                    expect( model["export"] ).to.have.been.calledOnce;
                } );

                // Remove the spy
                _.each( models, function ( model ) { model["export"].restore(); } );

            } );

            it( 'returns an empty array if the collection does not hold any models', function () {

                var collection = new Backbone.Collection();
                expect( collection["export"]() ).to.deep.equal( [] );

            } );

            it( 'does not call any method on the collection itself', function () {

                var collectionWithMethods = new CollectionWithMethods( models );
                sinon.spy( collectionWithMethods, "method" );

                collectionWithMethods["export"]();
                expect( collectionWithMethods.method ).not.to.have.been.called;

            } );

            it( 'returns identical results with and without custom methods having been added to the collection', function () {

                var collectionWithMethods = new CollectionWithMethods( modelsWithExportedMethods );
                var plainCollection       = new Backbone.Collection( modelsWithExportedMethods );

                expect( collectionWithMethods["export"]() ).to.deep.equal( plainCollection["export"]() );

            } );

        } );

        describe( 'The "exportable" property stores the methods which are called on export.', function () {

            describe( 'It accepts', function () {

                it_accepts( 'a string with the name of the method. export() evaluates the method and returns it as a property', function () {

                    var Collection = CollectionWithMethods.extend( { exportable: "method" } );
                    var collection = new Collection( models );

                    expect( collection["export"]() ).to.have.a.property( 'method' ).with.a.string( "collection method, returning a value" );

                } );

                it_accepts( 'a string in the format "this.method". export() evaluates the method and returns it as a property', function () {

                    var Collection = CollectionWithMethods.extend( { exportable: "this.method" } );
                    var collection = new Collection( models );

                    expect( collection["export"]() ).to.have.a.property( 'method' ).with.a.string( "collection method, returning a value" );

                } );

                it_accepts( 'an array of method names. export() evaluates all of them and returns them as properties', function () {

                    var Collection = CollectionWithMethods.extend( {
                        exportable: [ "method", "this.anotherMethod" ],
                        anotherMethod: function () { return "another collection method, returning a value"; }
                    } );
                    var collection = new Collection( models );

                    expect( collection["export"]() ).to.have.a.property( 'method' ).with.a.string( "collection method, returning a value" );
                    expect( collection["export"]() ).to.have.a.property( 'anotherMethod' ).with.a.string( "another collection method, returning a value" );

                } );

            } );

            describe( 'By default, in non-strict mode, it ignores', function () {

                it( 'when a method or property is declared as exportable but does not exist', function () {

                    var Collection = CollectionWithMethods.extend( { exportable: "missing" } );
                    var collection = new Collection( models );

                    var exportedModelHashes = _.map( models, function( model ) { return model["export"](); } );
                    expect( collection["export"]() ).to.eql( exportedModelHashes );

                } );

            } );

            describe( 'In strict mode, it causes an error on export()', function () {

                beforeEach( function () {
                    Backbone.Collection.prototype["export"].global.strict = true;
                } );

                afterEach( function () {
                    Backbone.Collection.prototype["export"].global.strict = false;
                } );

                it_throws_an_error( 'when a method or property does not exist', function () {

                    var Collection = CollectionWithMethods.extend( { exportable: "missing" } );
                    var collection = new Collection( models );

                    var exportFunction = _.bind( collection["export"], collection );

                    expect( exportFunction ).to.throw( Error, "Can't export \"missing\". The method doesn't exist" );

                } );

            } );

            describe( 'It always causes an error on export()', function () {

                it_throws_an_error( 'when being assigned a method reference', function () {

                    var Collection = CollectionWithMethods.extend( {
                        initialize: function () { this.exportable = [ this.method ]; }
                    } );
                    var collection = new Collection( models );

                    var exportFunction = _.bind( collection["export"], collection );
                    expect( exportFunction ).to.throw( Error, "'exportable' property: Invalid method identifier" );

                } );

                it_throws_an_error( 'if an exported collection method would overwrite a native array property', function () {

                    var Collection = Backbone.Collection.extend( {
                        exportable: "join",
                        join: function () { return "foo"; }
                    } );
                    var collection = new Collection( models );

                    var exportFunction = _.bind( collection["export"], collection );

                    expect( exportFunction ).to.throw( Error, "Can't export a property with a name which is reserved for a native array property. Offending properties: join" );

                } );

            } );

            describe( 'It', function () {

                it( 'does not change how the models in the collection are returned: as an array of export()ed model hashes', function () {

                    var Collection = CollectionWithMethods.extend( { exportable: "method" } );
                    var collection = new Collection( modelsWithExportedMethods );

                    var expectedModelHashes = _.map( modelsWithExportedMethods, function( model ) { return model["export"](); } );
                    var exportedModelHashes = _.map( collection["export"](), function( modelHash ) {return modelHash; } );
                    expect( exportedModelHashes ).to.deep.equal( expectedModelHashes );

                } );

               it( 'ignores methods which are declared as exportable, but return a value of undefined', function () {
                    // This conforms to the JSON spec. Valid JSON does not represent undefined values.
                    var Collection = Backbone.Collection.extend( {
                        exportable: "method",
                        method: function () {
                            return undefined;
                        }
                    } );
                    var collection = new Collection();

                    expect( collection["export"]() ).to.deep.equal( [] );
                } );

            } );

            describe( 'It also handles ordinary properties of the collection, not just methods. It', function () {

               it( 'exports properties with a string value', function () {
                    var Collection = Backbone.Collection.extend( {
                        exportable: "property",
                        property: "string property value"
                    } );
                    var collection = new Collection();

                    expect( collection["export"]() ).to.have.a.property( 'property' ).with.a.string( "string property value" );
                } );

                it( 'exports properties with a boolean value of true', function () {
                    var Collection = Backbone.Collection.extend( {
                        exportable: "property",
                        property: true
                    } );
                    var collection = new Collection();

                    expect( collection["export"]() ).to.have.a.property( 'property' );
                    expect( collection["export"]().property ).to.be.a( 'boolean' );
                    expect( collection["export"]().property ).to.be.true;
                } );

                it( 'exports properties with a boolean value of false', function () {
                    var Collection = Backbone.Collection.extend( {
                        exportable: "property",
                        property: false
                    } );
                    var collection = new Collection();

                    expect( collection["export"]() ).to.have.a.property( 'property' );
                    expect( collection["export"]().property ).to.be.a( 'boolean' );
                    expect( collection["export"]().property ).to.be.false;
                } );

                it( 'exports properties with a null value', function () {
                    var Collection = Backbone.Collection.extend( {
                        exportable: "property",
                        property: null
                    } );
                    var collection = new Collection();

                    var expected = [];
                    expected.property = null;

                    expect( collection["export"]() ).to.have.a.property( 'property' );
                    expect( collection["export"]() ).to.deep.equal( expected );
                } );

                it( 'ignores properties which exist, but have a value of undefined', function () {
                    // This conforms to the JSON spec. Valid JSON does not represent undefined values.
                    var Collection = Backbone.Collection.extend( {
                        exportable: "property",
                        property: undefined
                    } );
                    var collection = new Collection();

                    expect( collection["export"]() ).to.deep.equal( [] );
                } );

                it( 'attaches exported properties to the array of models (as direct properties of the array object)', function () {

                    var Collection = Backbone.Collection.extend( {
                        exportable: "property",
                        property: "ordinary property value"
                    } );
                    var collection = new Collection( modelsWithExportedMethods );

                    var expectedModelHashes = _.map( modelsWithExportedMethods, function( model ) { return model["export"](); } );
                    var expectedExport = expectedModelHashes;
                    expectedExport.property = "ordinary property value";

                    expect( collection["export"]() ).to.deep.equal( expectedExport );
                } );

            } );

            describe( 'It calls export() recursively', function () {

                var OuterCollection, ModelWithMethod, InnerModel, innerModel, innerModel_expectedExport,
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

                    ModelWithMethod = Backbone.Model.extend( {
                        method: function () { return "returning a value"; }
                    } );

                    InnerModel = ModelWithMethod.extend( { exportable: "method" } );
                    innerModel = new InnerModel();
                    innerModel_expectedExport = innerModel["export"]();

                    InnerCollection = Backbone.Collection.extend( {
                        exportable: "method",
                        method: function() { return "returned by method of inner collection"; }
                    } );
                    innerCollection = new InnerCollection();
                    innerCollection_expectedExport = innerCollection["export"]();

                    deeplyNestedModel                 = { levelOneProp: [ 1, { nestedHere: innerModel             }, 3 ] };
                    deeplyNestedModel_ExpectedExport  = { levelOneProp: [ 1, { nestedHere: innerModel["export"]() }, 3 ] };

                    // NB deeplyNestedCollection: is a _model_, with a deeply nested collection inside
                    deeplyNestedCollection                = { levelOneProp: [ 1, { nestedHere: innerCollection             }, 3 ] };
                    deeplyNestedCollection_expectedExport = { levelOneProp: [ 1, { nestedHere: innerCollection["export"]() }, 3 ] };

                    sinon.spy( innerModel, "export" );
                    sinon.spy( innerCollection, "export" );

                });

                afterEach( function () {
                    if ( innerModel["export"].restore ) innerModel["export"].restore();
                    if ( innerCollection["export"].restore ) innerCollection["export"].restore();
                });


                it_acts_recursively( 'on models which are returned by an exported collection method', function () {

                    var collection = getOuterCollection( { exportable: "returnsInner" } );
                    collection.setInnerObject( innerModel );

                    var exported = collection["export"]();

                    var expectedArr = [];
                    expectedArr.returnsInner = innerModel_expectedExport;

                    expect( innerModel["export"] ).to.have.been.calledOnce;
                    expect( exported ).to.deep.equal( expectedArr );
                } );

                it_acts_recursively( 'on inner, nested collections which are returned by an exported collection method', function () {

                    var collection = getOuterCollection( { exportable: "returnsInner" } );
                    collection.setInnerObject( innerCollection );

                    var exported = collection["export"]();

                    var expectedArr = [];
                    expectedArr.returnsInner = innerCollection_expectedExport;

                    expect( innerCollection["export"] ).to.have.been.calledOnce;
                    expect( exported ).to.deep.equal( expectedArr );

                } );

                it_acts_recursively( 'on models which are assigned to an exported collection property', function () {

                    var collection = getOuterCollection( { exportable: "propWithInnerObject" } );
                    collection.setInnerObject( innerModel );

                    var exported = collection["export"]();

                    var expectedArr = [];
                    expectedArr.propWithInnerObject = innerModel_expectedExport;

                    expect( innerModel["export"] ).to.have.been.calledOnce;
                    expect( exported ).to.deep.equal( expectedArr );

                } );

                it_acts_recursively( 'on inner, nested collections which are assigned to an exported collection property', function () {

                    var collection = getOuterCollection( { exportable: "propWithInnerObject" } );
                    collection.setInnerObject( innerCollection );

                    var exported = collection["export"]();

                    var expectedArr = [];
                    expectedArr.propWithInnerObject = innerCollection_expectedExport;

                    expect( innerCollection["export"] ).to.have.been.calledOnce;
                    expect( exported ).to.deep.equal( expectedArr );

                } );

                withCloneDeep_it_acts_recursively( '[+ _.cloneDeep] on inner models, deeply nested within other structures and returned by an exported method', function () {

                    var collection = getOuterCollection( { exportable: "returnsInner" } );
                    collection.setInnerObject( deeplyNestedModel );

                    var exported = collection["export"]();

                    var expectedArr = [];
                    expectedArr.returnsInner = deeplyNestedModel_ExpectedExport;

                    expect( innerModel["export"] ).to.have.been.calledOnce;
                    expect( exported ).to.deep.equal( expectedArr );

                } );

                withCloneDeep_it_acts_recursively( '[+ _.cloneDeep] on inner collections, deeply nested within other structures and returned by an exported method', function () {

                    var collection = getOuterCollection( { exportable: "returnsInner" } );
                    collection.setInnerObject( deeplyNestedCollection );

                    var exported = collection["export"]();

                    var expectedArr = [];
                    expectedArr.returnsInner = deeplyNestedCollection_expectedExport;

                    expect( innerCollection["export"] ).to.have.been.calledOnce;
                    expect( exported ).to.deep.equal( expectedArr );

                } );

                withCloneDeep_it_acts_recursively( '[+ _.cloneDeep] on inner models, deeply nested within other structures and assigned to an exported property', function () {

                    var collection = getOuterCollection( { exportable: "propWithInnerObject" } );
                    collection.setInnerObject( deeplyNestedModel );

                    var exported = collection["export"]();

                    var expectedArr = [];
                    expectedArr.propWithInnerObject = deeplyNestedModel_ExpectedExport;

                    expect( innerModel["export"] ).to.have.been.calledOnce;
                    expect( exported ).to.deep.equal( expectedArr );

                } );

                withCloneDeep_it_acts_recursively( '[+ _.cloneDeep] on inner collections, deeply nested within other structures and assigned to an exported property', function () {

                    var collection = getOuterCollection( { exportable: "propWithInnerObject" } );
                    collection.setInnerObject( deeplyNestedCollection );

                    var exported = collection["export"]();

                    var expectedArr = [];
                    expectedArr.propWithInnerObject = deeplyNestedCollection_expectedExport;

                    expect( innerCollection["export"] ).to.have.been.calledOnce;
                    expect( exported ).to.deep.equal( expectedArr );

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

                    collection1["export"]();

                    // Recursion depth of export calls (hops). Equals call count  - 1 (the initial export call is not a
                    // hop).
                    var hops = collection1["export"].callCount + collection2["export"].callCount - 1;

                    expect( hops ).to.equal( Collection.prototype["export"].global.maxHops );

                } );

            } );

        } );

        describe( 'The onExport() handler', function () {

            it( 'is run by export(). It receives an array of model hashes - the data designated for export - as an argument', function () {

                var collection = new Backbone.Collection( modelsWithExportedMethods );
                sinon.spy( collection, "onExport" );

                var exportedModels = _.map( modelsWithExportedMethods, function( model ) { return model["export"](); } );

                collection["export"]();
                expect( collection.onExport ).to.have.been.calledWithExactly( exportedModels );

            } );

            it( 'receives the array last. Ie, the methods of the collection which are marked as "exportable" have already been transformed into properties of the array', function () {

                var Collection = CollectionWithMethods.extend( { exportable: "method" } );
                var collection = new Collection( [] );
                sinon.spy( collection, "onExport" );

                var expected = [];
                expected.method = "collection method, returning a value";

                collection["export"]();
                expect( collection.onExport ).to.have.been.calledWithExactly( expected );

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

                expect( collection["export"]() ).to.have.a.property( 'property' ).with.a.string( "in modified state" );

            } );

            it( 'does not allow to overwrite a native array property and throws an error', function () {

                var Collection = Backbone.Collection.extend( {
                    onExport: function ( data ) {
                        data.join = "foo";
                        data.concat = "bar";
                        return data;
                    }
                } );
                var collection = new Collection( models );

                var exportFunction = _.bind( collection["export"], collection );

                expect( exportFunction ).to.throw( Error, /Can't export a property with a name which is reserved for a native array property\. Offending properties: (join, concat|concat, join)/ );

            } );

        } );

        describe( 'The onBeforeExport() handler', function () {

            it( 'is run when export() is called', function () {

                var collection = new Backbone.Collection();
                sinon.spy( collection, "onBeforeExport" );

                collection["export"]();
                expect( collection.onBeforeExport ).to.have.been.calledOnce;

            } );

            it( 'can modify the collection state before it is turned into a hash', function () {

                var traceMe =  new Backbone.Model( { traceMe: true } );

                var Collection = Backbone.Collection.extend( {
                    onBeforeExport: function () {
                        this.add( traceMe );
                    }
                } );
                var collection = new Collection();

                expect( collection["export"]() ).to.deep.equal( [ traceMe["export"]() ] );

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

                expect( collection["export"]() ).to.have.a.property( 'method' ).with.a.string( "manipulated method return value" );

            } );

            it( 'alters the collection state permanently, beyond the export() call', function () {

                var traceMe =  new Backbone.Model( { traceMe: true } );

                var Collection = Backbone.Collection.extend( {
                    onBeforeExport: function () {
                        this.add( traceMe );
                    }
                } );
                var collection = new Collection();

                collection["export"]();
                expect( collection.at( 0 ) ).to.deep.equal( traceMe );

            } );

            it( 'runs before onExport()', function () {

                var collection = new Backbone.Collection();
                sinon.spy( collection, "onBeforeExport" );
                sinon.spy( collection, "onExport" );

                collection["export"]();
                expect( collection.onBeforeExport ).to.have.been.calledBefore( collection.onExport );

            } );

        } );

        describe( 'The onAfterExport() handler', function () {

            it( 'is run when export() is called', function () {

                var collection = new Backbone.Collection();
                sinon.spy( collection, "onAfterExport" );

                collection["export"]();
                expect( collection.onAfterExport ).to.have.been.calledOnce;

            } );

            it( 'can act on the model state after it has been turned into a hash, leaving the exported hash unchanged', function () {

                var traceMe = new Backbone.Model( { traceMe: true } );

                var Collection = Backbone.Collection.extend( {
                    onAfterExport: function () {
                        this.add( traceMe );
                    }
                } );
                var collection = new Collection();

                expect( collection["export"]() ).to.deep.equal( [] );
                expect( collection.at( 0 ) ).to.deep.equal( traceMe );

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

                expect( collection["export"]() ).to.have.a.property( 'method' ).with.a.string( "original method return value" );
                expect( collection.method() ).to.be.a.string( "manipulated method return value" );

            } );

            it( 'runs after onExport()', function () {

                var collection = new Backbone.Collection();
                sinon.spy( collection, "onAfterExport" );
                sinon.spy( collection, "onExport" );

                collection["export"]();
                expect( collection.onAfterExport ).to.have.been.calledAfter( collection.onExport );

            } );

        } );

    } );

})();
