/*global describe, it */
'use strict';

(function () {

    var it_accepts = it,
        it_throws_an_error = it,
        they = it,
        expectation = it;

    // Detect the ability to create deep clones with the utility library (Lo-dash build with _.cloneDeep support vs
    // Underscore), and make test execution dependent on it for affected tests.
    var withCloneDeep_it = ( _.cloneDeep ? it : it.skip ),                      // Lo-dash build with cloneDeep support
        withCloneDeep_they = withCloneDeep_it,
        withCloneDeep_describe = ( _.cloneDeep ? describe : describe.skip ),
        withoutCloneDeep_they = ( _.cloneDeep ? it.skip : it );                 // Underscore (no deep cloning support)

    function cloneDeep ( obj ) {
        return jQuery.extend( true, {}, obj );
    }

    describe( 'A Backbone model is enhanced with the export functionality.', function () {

        var ModelWithMethod;

        beforeEach( function () {

            ModelWithMethod = Backbone.Model.extend( {
                method: function () { return "returning a value"; }
            } );

        });

        describe( 'By default, export()', function () {

            it( 'returns a hash of model properties, just like toJSON()', function () {

                var model = new Backbone.Model();

                model.set( { property: "a value", anotherProperty: "another value" } );
                var propHash = model.toJSON();
                model.export().should.deep.equal( propHash );

            } );

            it( 'does not call any method', function () {

                var model = new ModelWithMethod();
                sinon.spy( model, "method" );

                model.export();
                model.method.should.not.have.been.called;

            } );

            it( 'does not alter the properties hash, even if custom methods have been added to the model', function () {

                var model = new ModelWithMethod();

                model.set( { property: "a value", anotherProperty: "another value" } );
                var propHash = model.toJSON();
                model.export().should.deep.equal( propHash );

            } );

        } );

        describe( 'The "exportable" property stores the methods which are called on export.', function () {

            describe( 'It accepts', function () {

                it_accepts( 'a string with the name of the method. export() evaluates the method and returns it as a property', function () {

                    var Model = ModelWithMethod.extend( { exportable: "method" } );
                    var model = new Model();

                    model.export().should.have.a.property( 'method' ).with.a.string( "returning a value" );

                } );

                it_accepts( 'a string in the format "this.method". export() evaluates the method and returns it as a property', function () {

                    var Model = ModelWithMethod.extend( { exportable: "this.method" } );
                    var model = new Model();

                    model.export().should.have.a.property( 'method' ).with.a.string( "returning a value" );

                } );

                it_accepts( 'an array of method names. export() evaluates all of them and returns them as properties', function () {

                    var Model = Backbone.Model.extend( {
                        exportable: [ "method", "this.anotherMethod" ],
                        method: function () { return "returning a value"; },
                        anotherMethod: function () { return "returning another value"; }
                    } );
                    var model = new Model();

                    model.export().should.have.a.property( 'method' ).with.a.string( "returning a value" );
                    model.export().should.have.a.property( 'anotherMethod' ).with.a.string( "returning another value" );

                } );

            } );

            describe( 'It causes an error on export()', function () {

                it_throws_an_error( 'when being assigned a method reference', function () {

                    // Assigning method references had been implemented and did work, but introduced unnecessary complexity
                    // and was difficult to use correctly.
                    var Model = ModelWithMethod.extend( {
                        initialize: function () { this.exportable = [ this.method ]; }
                    } );
                    var model = new Model();

                    var exportFunction = _.bind( model.export, model );
                    exportFunction.should.throw( Error, "'exportable' property: Invalid method identifier" );

                } );

                it_throws_an_error( 'when one of the methods doesn\'t exist', function () {

                    var Model = ModelWithMethod.extend( { exportable: "missing" } );
                    var model = new Model();

                    var exportFunction = _.bind( model.export, model );
                    exportFunction.should.throw( Error, "Can't export \"missing\". The method doesn't exist" );

                } );

                it_throws_an_error( 'when one of the methods is in fact not a function', function () {

                    var Model = Backbone.Model.extend( {
                        exportable: "property",
                        property: "ordinary property, not a method"
                    } );
                    var model = new Model();

                    var exportFunction = _.bind( model.export, model );
                    exportFunction.should.throw( Error, "'exportable' property: Invalid method identifier \"property\", does not point to a function" );

                } );

            } );

        } );

        describe( 'The export() method works recursively.', function () {

            describe( 'Nesting scenarios:', function () {

                var OuterModel, outerModel,
                    InnerModel, innerModel,
                    InnerCollection, innerCollection,
                    innerModelClone, innerCollectionClone,
                    deeplyNestedModel, deeplyNestedModel_ExpectedExport,
                    deeplyNestedCollection, deeplyNestedCollection_expectedExport,
                    deeplyNestedModelClone, deeplyNestedCollectionClone;

                beforeEach( function() {

                    OuterModel = Backbone.Model.extend( {
                        exportable: "returnsInner",
                        returnsInner: function () { return this._innerObject; },
                        _innerObject: undefined,
                        setInnerObject: function ( innerObject ) { this._innerObject = innerObject; }
                    } );

                    outerModel = new OuterModel();

                    InnerModel = ModelWithMethod.extend( { exportable: "method" } );
                    innerModel = new InnerModel( { foo: "bar" } );

                    InnerCollection = Backbone.Collection.extend( {
                        exportable: "method",
                        method: function() { return "returned by method of inner collection"; }
                    } );
                    innerCollection = new InnerCollection();

                    deeplyNestedModel                 = { levelOneProp: [ 1, { nestedHere: innerModel          }, 3 ] };
                    deeplyNestedModel_ExpectedExport  = { levelOneProp: [ 1, { nestedHere: innerModel.export() }, 3 ] };

                    deeplyNestedCollection                = { levelOneProp: [ 1, { nestedHere: innerCollection          }, 3 ] };
                    deeplyNestedCollection_expectedExport = { levelOneProp: [ 1, { nestedHere: innerCollection.export() }, 3 ] };

                    sinon.spy( innerModel, "export" );
                    sinon.spy( innerCollection, "export" );

                    innerModelClone = cloneDeep( innerModel );
                    innerCollectionClone = cloneDeep( innerCollection );

                    deeplyNestedModelClone = cloneDeep( deeplyNestedModel );
                    deeplyNestedCollectionClone = cloneDeep( deeplyNestedCollection );

                });

                afterEach( function () {
                    if ( innerModel.export.restore ) innerModel.export.restore();
                    if ( innerCollection.export.restore ) innerCollection.export.restore();
                    if ( innerModelClone.export.restore ) innerModelClone.export.restore();
                    if ( innerCollectionClone.export.restore ) innerCollectionClone.export.restore();
                });

                describe( 'An exported method returns an inner model', function () {

                    expectation( 'the inner model has export() called on it', function () {

                        outerModel.setInnerObject( innerModel );
                        var exported = outerModel.export();

                        innerModel.export.should.have.been.calledOnce;
                        exported.should.be.deep.equal( { returnsInner: innerModel.export() } );

                    } );

                    expectation( 'the inner model is unaffected by changes to its exported hash', function () {

                        outerModel.setInnerObject( innerModel );
                        var exported = outerModel.export();

                        // Inner model has been properly cloned
                        exported.returnsInner.appendedAfterwards = "should not appear in inner model";
                        innerModel.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the method producing the model stays untouched, immune to manipulation of the exported data', function () {

                        outerModel.setInnerObject( innerModel );
                        var exported = outerModel.export();

                        // Outer model still holds a reference to the original inner model
                        exported.returnsInner = "overwrite the exported inner model";
                        outerModel.returnsInner().should.be.deep.equal( innerModelClone );

                    } );

                } );

                describe( 'An exported method returns an inner model, which in turn has an exported method returning yet another model', function () {

                    var middleModel, outerModelClone;

                    beforeEach( function () {

                        middleModel = new OuterModel();
                        middleModel.setInnerObject( innerModel );
                        outerModel.setInnerObject( middleModel );

                        outerModelClone = cloneDeep( outerModel );

                    } );

                    expectation( 'the innermost model has export() called on it', function () {

                        var exported = outerModel.export();

                        innerModel.export.should.have.been.calledOnce;
                        exported.should.be.deep.equal( {
                            returnsInner: {
                                returnsInner: innerModel.export()
                            }
                        } );

                    } );

                    expectation( 'the outer model is not altered by the export itself, including the models nested inside (deep equality)', function () {

                        outerModel.export();

                        // Inner model has been properly cloned
                        outerModel.should.be.deep.equal( outerModelClone );

                    } );

                    expectation( 'the innermost model is unaffected by changes to its exported hash', function () {

                        var exported = outerModel.export();

                        // Inner model has been properly cloned
                        exported.returnsInner.returnsInner.appendedAfterwards = "should not appear in inner model";
                        innerModel.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the method producing the innermost model stays untouched, immune to manipulation of the exported data', function () {

                        var exported = outerModel.export();

                        // Middle model still holds a reference to the original inner model
                        exported.returnsInner = "overwrite the exported inner model";
                        middleModel.returnsInner().should.be.deep.equal( innerModelClone );

                    } );

                    expectation( 'the middle model is unaffected by changes to its exported hash', function () {

                        var exported = outerModel.export();

                        // Middle model has been properly cloned
                        exported.returnsInner.appendedAfterwards = "should not appear in middle model";
                        middleModel.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the method producing the middle model stays untouched, immune to manipulation of the exported data', function () {

                        var middleModelClone = cloneDeep( middleModel );
                        var exported = outerModel.export();

                        // Outer model still holds a reference to the original middle model
                        exported.returnsInner = "overwrite the exported middle model";
                        outerModel.returnsInner().should.be.deep.equal( middleModelClone );

                    } );

                } );

                describe( 'An exported method returns an inner collection', function () {

                    expectation( 'the inner collection has export() called on it', function () {

                        outerModel.setInnerObject( innerCollection );
                        var exported = outerModel.export();

                        innerCollection.export.should.have.been.calledOnce;
                        exported.should.be.deep.equal( { returnsInner: innerCollection.export() } );

                    } );

                    expectation( 'the inner collection is unaffected by changes to the corresponding exported array', function () {

                        outerModel.setInnerObject( innerCollection );
                        var exported = outerModel.export();

                        // Inner model has been properly cloned
                        exported.returnsInner.appendedAfterwards = "should not appear in inner collection";
                        innerCollection.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the method producing the collection stays untouched, immune to manipulation of the exported data', function () {

                        outerModel.setInnerObject( innerCollection );
                        var exported = outerModel.export();

                        // Outer model still holds a reference to the original inner model
                        exported.returnsInner = "overwrite the exported inner collection";
                        outerModel.returnsInner().should.be.deep.equal( innerCollectionClone );

                    } );

                } );

                describe( 'An attribute holds an inner model', function () {

                    expectation( 'the inner model has export() called on it', function () {

                        var model = new Backbone.Model( { containerAttribute: innerModel } );
                        var exported = model.export();

                        innerModel.export.should.have.been.calledOnce;
                        exported.should.be.deep.equal( { containerAttribute: innerModel.export() } );

                    } );

                    expectation( 'the inner model is unaffected by changes to its exported hash', function () {

                        var model = new Backbone.Model( { containerAttribute: innerModel } );
                        var exported = model.export();

                        exported.containerAttribute.appendedAfterwards = "should not appear in inner model";
                        innerModel.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the attribute of the outer model continues to hold a reference to the inner model, immune to manipulation of the exported data', function () {

                        var model = new Backbone.Model( { containerAttribute: innerModel } );
                        var exported = model.export();

                        exported.containerAttribute = "overwrite the exported inner collection";
                        model.get( "containerAttribute" ).should.be.deep.equal( innerModelClone );

                    } );

                } );

                describe( 'An attribute holds an inner collection', function () {

                    expectation( 'the inner collection has export() called on it', function () {

                        var model = new Backbone.Model( { containerAttribute: innerCollection } );
                        var exported = model.export();

                        innerCollection.export.should.have.been.calledOnce;
                        exported.should.be.deep.equal( { containerAttribute: innerCollection.export() } );

                    } );

                    expectation( 'the inner collection is unaffected by changes to the corresponding exported array', function () {

                        var model = new Backbone.Model( { containerAttribute: innerCollection } );
                        var exported = model.export();

                        exported.containerAttribute.appendedAfterwards = "should not appear in inner collection";
                        innerCollection.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the attribute of the outer model continues to hold a reference to the inner collection, immune to manipulation of the exported data', function () {

                        var model = new Backbone.Model( { containerAttribute: innerCollection } );
                        var exported = model.export();

                        exported.containerAttribute = "overwrite the exported inner collection";
                        model.get( "containerAttribute" ).should.be.deep.equal( innerCollectionClone );

                    } );

                } );

                withCloneDeep_describe( '[+ _.cloneDeep] An exported method returns an inner model, deeply nested within other structures', function () {

                    expectation( 'the inner model has export() called on it', function () {

                        outerModel.setInnerObject( deeplyNestedModel );
                        var exported = outerModel.export();

                        innerModel.export.should.have.been.calledOnce;
                        exported.should.be.deep.equal( { returnsInner: deeplyNestedModel_ExpectedExport } );

                    } );

                    expectation( 'the inner model is unaffected by changes to its exported hash', function () {

                        outerModel.setInnerObject( deeplyNestedModel );
                        var exported = outerModel.export();

                        exported.returnsInner.levelOneProp[1].nestedHere.appendedAfterwards = "should not appear in inner model";
                        innerModel.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the object wrapping the inner model stays untouched, immune to manipulation of the exported data', function () {

                        outerModel.setInnerObject( deeplyNestedModel );
                        var exported = outerModel.export();

                        exported.returnsInner.levelOneProp[1].nestedHere = "overwrite the exported inner model";
                        outerModel.returnsInner().should.be.deep.equal( deeplyNestedModelClone );

                    } );

                } );

                withCloneDeep_describe( '[+ _.cloneDeep] An exported method returns an inner collection, deeply nested within other structures', function () {

                    expectation( 'the inner collection has export() called on it', function () {

                        outerModel.setInnerObject( deeplyNestedCollection );
                        var exported = outerModel.export();

                        innerCollection.export.should.have.been.calledOnce;
                        exported.should.be.deep.equal( { returnsInner: deeplyNestedCollection_expectedExport } );

                    } );

                    expectation( 'the inner collection is unaffected by changes to the corresponding exported array', function () {

                        outerModel.setInnerObject( deeplyNestedCollection );
                        var exported = outerModel.export();

                        exported.returnsInner.levelOneProp[1].nestedHere.appendedAfterwards = "should not appear in inner model";
                        innerCollection.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the object wrapping the inner collection stays untouched, immune to manipulation of the exported data', function () {

                        outerModel.setInnerObject( deeplyNestedCollection );
                        var exported = outerModel.export();

                        exported.returnsInner.levelOneProp[1].nestedHere = "overwrite the exported inner collection";
                        outerModel.returnsInner().should.be.deep.equal( deeplyNestedCollectionClone );

                    } );

                } );

                withCloneDeep_describe( '[+ _.cloneDeep] An attribute holds an inner model, deeply nested within other structures', function () {

                    expectation( 'the inner model has export() called on it', function () {

                        var model = new Backbone.Model( { containerAttribute: deeplyNestedModel } );
                        var exported = model.export();

                        innerModel.export.should.have.been.calledOnce;
                        exported.should.be.deep.equal( { containerAttribute: deeplyNestedModel_ExpectedExport } );

                    } );

                    expectation( 'the inner model is unaffected by changes to its exported hash', function () {

                        var model = new Backbone.Model( { containerAttribute: deeplyNestedModel } );
                        var exported = model.export();

                        exported.containerAttribute.levelOneProp[1].nestedHere.appendedAfterwards = "should not appear in inner model";
                        innerModel.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the object wrapping the inner model stays untouched, immune to manipulation of the exported data', function () {

                        var model = new Backbone.Model( { containerAttribute: deeplyNestedModel } );
                        var exported = model.export();

                        exported.containerAttribute.levelOneProp[1].nestedHere = "overwrite the exported inner collection";
                        model.get( "containerAttribute" ).should.be.deep.equal( deeplyNestedModelClone );

                    } );

                } );

                withCloneDeep_describe( '[+ _.cloneDeep] An attribute holds an inner collection, deeply nested within other structures', function () {

                    expectation( 'the inner collection has export() called on it', function () {

                        var model = new Backbone.Model( { containerAttribute: deeplyNestedCollection } );
                        var exported = model.export();

                        innerCollection.export.should.have.been.calledOnce;
                        exported.should.be.deep.equal( { containerAttribute: deeplyNestedCollection_expectedExport } );

                    } );

                    expectation( 'the inner collection is unaffected by changes to the corresponding exported array', function () {

                        var model = new Backbone.Model( { containerAttribute: deeplyNestedCollection } );
                        var exported = model.export();

                        exported.containerAttribute.levelOneProp[1].nestedHere.appendedAfterwards = "should not appear in inner model";
                        innerCollection.should.not.have.a.property( "appendedAfterwards" );

                    } );

                    expectation( 'the object wrapping the inner collection stays untouched, immune to manipulation of the exported data', function () {

                        var model = new Backbone.Model( { containerAttribute: deeplyNestedCollection } );
                        var exported = model.export();

                        exported.containerAttribute.levelOneProp[1].nestedHere = "overwrite the exported inner collection";
                        model.get( "containerAttribute" ).should.be.deep.equal( deeplyNestedCollectionClone );

                    } );

                } );

            } );

            describe( 'Circular references during recursion', function () {

                var model1, model2, model3, Model;

                beforeEach( function () {

                    Model = Backbone.Model.extend({
                        exportable: "next",
                        _next: undefined,
                        setNext: function ( next ) { this._next = next },
                        next: function () { return this._next }
                    });

                    model1 = new Model();
                    model2 = new Model();
                    model3 = new Model();

                } );
                they( 'are caught when two objects return each other in an export, and don\'t cause an infinite loop (single hop)', function () {
                    //  1 .next -> 2 .next -> 1
                    model1.setNext( model2 );
                    model2.setNext( model1 );

                    model1.export();
                } );

                they( 'are caught when the chain extends across several models, and don\'t cause an infinite loop (multiple hops)', function () {
                    //  1 .next -> 2 .next -> 3 .next -> 1
                    model1.setNext( model2 );
                    model2.setNext( model3 );
                    model3.setNext( model1 );

                    model1.export();
                } );

                they( 'are caught with intermediate objects in between which are not Backbone models or collections (multiple hops, not invoking export() in part of the chain)', function () {
                    // model 1 .next -> array -> element: generic object -> property: model 2 .next -> model 1
                    model1.setNext( [ { property: model2 } ] );
                    model2.setNext( model1 );

                    model1.export();
                } );

                they( 'return an exported representation of each model in the cyle until the recursion limit has been reached', function () {
                    //  1 .next -> 2 .next -> 1
                    model1.setNext( model2 );
                    model2.setNext( model1 );

                    var maxHops = Model.prototype.export.maxHops;
                    // Last exported model: Underscore returns a reference to the model, Lo-dash with _.cloneDeep
                    // returns _.cloneDeep( last model )
                    var exportedLast = _.cloneDeep ? _.cloneDeep : function ( model ) { return model };

                    var expectedHash = maxHops % 2 ? exportedLast( model1 ) : exportedLast( model2 );
                    for ( var i = 0; i <= maxHops; i++ ) expectedHash = { next: expectedHash };

                    var exported = model1.export();
                    exported.should.be.deep.equal( expectedHash );
                } );

                withoutCloneDeep_they( '[- _.cloneDeep] return a reference to the last model when the recursion limit has been reached', function () {
                    // This test is ignored when Lodash is used during the test run; executed with Underscore

                    //  1 .next -> 2 .next -> 1
                    model1.setNext( model2 );
                    model2.setNext( model1 );

                    var seed = model1;

                    var expectedLast = seed.next(), hops = 0;
                    while ( hops++ < Model.prototype.export.maxHops ) expectedLast = expectedLast.next();

                    var exported = seed.export();
                    var inner = exported.next;
                    while ( !_.isFunction( inner.next ) ) inner = inner.next;

                    inner.should.be.deep.equal( expectedLast );
                } );

                withCloneDeep_they( '[+ _.cloneDeep] return a _.cloneDeep representation of the last model (deep clone of properties) when the recursion limit has been reached', function () {
                    // This test is ignored when Underscore is used during the test run; executed with Lodash

                    //  1 .next -> 2 .next -> 1
                    model1.setNext( model2 );
                    model2.setNext( model1 );

                    var seed = model1;

                    var expectedLast = seed.next(), hops = 0;
                    while ( hops++ < Model.prototype.export.maxHops ) expectedLast = expectedLast.next();
                    expectedLast = _.cloneDeep( expectedLast );

                    var exported = seed.export();
                    var inner = exported.next;
                    while ( inner.next ) inner = inner.next;

                    inner.should.be.deep.equal( expectedLast );
                } );

            } );

        } );

        describe( 'The onExport() handler', function () {

            it( 'is run by export(). It receives a hash of the model properties - the toJSON() data - as an argument', function () {

                var model = new Backbone.Model();
                sinon.spy( model, "onExport" );

                model.set( { property: "a value", anotherProperty: "another value" } );
                var propHash = model.toJSON();

                model.export();
                model.onExport.should.have.been.calledWithExactly( propHash );

            } );

            it( 'receives the properties hash last, ie after the methods marked as "exportable" have been transformed into properties of the hash', function () {

                var Model = ModelWithMethod.extend( { exportable: "method" } );
                var model = new Model();
                sinon.spy( model, "onExport" );

                model.export();
                model.onExport.should.have.been.calledWithExactly( { method: "returning a value" } );

            } );

            it( 'is able to alter the data before it is returned by export()', function () {

                var Model = Backbone.Model.extend( {
                    onExport: function ( data ) {
                        data.property = "in modified state";
                        return data;
                    }
                } );
                var model = new Model();
                model.set( { property: "in original state" } );

                model.export().should.have.a.property( 'property' ).with.a.string( "in modified state" );

            } );

            it( 'acts (at least) on a shallow clone of the data, permitting to change to top-level properties of the data without affecting the model', function () {

                var Model = Backbone.Model.extend( {
                    defaults: { innerObject: { whoami: "inner object, model data" } },
                    onExport: function ( data ) {
                        data.innerObject = "a string replaces the inner object in exported data";
                        return data;
                    }
                } );
                var model = new Model();

                model.export();
                model.get( "innerObject" ).should.deep.equal( { whoami: "inner object, model data" } );

            } );

            withCloneDeep_it( '[+ _.cloneDeep] acts on a deep clone of the data, permitting to change to nested properties of the data without affecting the model', function () {

                var Model = Backbone.Model.extend( {
                    defaults: { innerObject: { whoami: "inner object, model data" } },
                    onExport: function ( data ) {
                        data.innerObject.whoami = "inner object, exported data";
                        return data;
                    }
                } );
                var model = new Model();

                model.export();
                model.get( "innerObject" ).whoami.should.equal( "inner object, model data" );

            } );

        } );

        describe( 'The onBeforeExport() handler', function () {

            it( 'is run when export() is called', function () {

                var model = new Backbone.Model();
                sinon.spy( model, "onBeforeExport" );

                model.export();
                model.onBeforeExport.should.have.been.calledOnce;

            } );

            it( 'can modify the model state before it is turned into a hash', function () {

                var Model = Backbone.Model.extend( {
                    onBeforeExport: function () {
                        this.set( { property: "in modified state" } );
                    }
                } );
                var model = new Model();

                model.set( { property: "in original state" } );

                model.export().should.have.a.property( 'property' ).with.a.string( "in modified state" );

            } );

            it( 'can manipulate other, "exportable" model methods before they are transformed and added to the hash', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    onBeforeExport: function () {
                        this.method = function () { return "manipulated method return value"; }
                    },
                    method: function () { return "original method return value"; }
                } );
                var model = new Model();

                model.export().should.have.a.property( 'method' ).with.a.string( "manipulated method return value" );

            } );

            it( 'runs before onExport()', function () {

                var model = new Backbone.Model();
                sinon.spy( model, "onBeforeExport" );
                sinon.spy( model, "onExport" );

                model.export();
                model.onBeforeExport.should.have.been.calledBefore( model.onExport );

            } );

        } );

        describe( 'The onAfterExport() handler', function () {

            it( 'is run when export() is called', function () {

                var model = new Backbone.Model();
                sinon.spy( model, "onAfterExport" );

                model.export();
                model.onAfterExport.should.have.been.calledOnce;

            } );

            it( 'can act on the model state after it has been turned into a hash, leaving the exported hash unchanged', function () {

                var Model = Backbone.Model.extend( {
                    onAfterExport: function () {
                        this.set( { property: "in modified state" } );
                    }
                } );
                var model = new Model();

                model.set( { property: "in original state" } );

                model.export().should.have.a.property( 'property' ).with.a.string( "in original state" );
                model.get( 'property' ).should.be.a.string( "in modified state" );

            } );

            it( 'can manipulate other, "exportable" model methods only after they have been transformed and added to the hash', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    onAfterExport: function () {
                        this.method = function () { return "manipulated method return value"; }
                    },
                    method: function () { return "original method return value"; }
                } );
                var model = new Model();

                model.export().should.have.a.property( 'method' ).with.a.string( "original method return value" );
                model.method().should.be.a.string( "manipulated method return value" );

            } );

            it( 'runs after onExport()', function () {

                var model = new Backbone.Model();
                sinon.spy( model, "onAfterExport" );
                sinon.spy( model, "onExport" );

                model.export();
                model.onAfterExport.should.have.been.calledAfter( model.onExport );

            } );

        } );

    } );

})();
