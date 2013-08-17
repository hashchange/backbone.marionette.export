/*global describe, it */
'use strict';

(function () {

    describe( 'A Backbone model is enhanced with the export functionality.', function () {

        describe( 'By default, export()', function () {

            it( 'returns a hash of model properties, exactly like toJSON()', function () {

                var Model = Backbone.Model.extend( {} );
                var model = new Model();

                model.set( { property: "a value", anotherProperty: "another value" } );
                var propHash = model.toJSON();
                model.export().should.deep.equal( propHash );

            } );

            it( 'does not call any method', function () {

                var Model = Backbone.Model.extend( {
                    method: function () { return "returning a value"; }
                } );
                var model = new Model();
                sinon.spy( model, "method" );

                model.export();
                model.method.should.not.have.been.called;

            } );

            it( 'does not alter the properties hash, even if custom methods have been added to the model', function () {

                var Model = Backbone.Model.extend( {
                    method: function () { return "returning a value"; }
                } );
                var model = new Model();

                model.set( { property: "a value", anotherProperty: "another value" } );
                var propHash = model.toJSON();
                model.export().should.deep.equal( propHash );

            } );

        } );

        describe( 'The "exportable" property stores the methods which are called on export. It', function () {

            it( 'accepts a string with the name of the method. export() evaluates the method and returns it as a property', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    method: function () { return "returning a value"; }
                } );
                var model = new Model();

                model.export().should.have.a.property( 'method' ).with.a.string( "returning a value" );

            } );

            it( 'accepts a string in the format "this.method". export() evaluates the method and returns it as a property', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "this.method",
                    method: function () { return "returning a value"; }
                } );
                var model = new Model();

                model.export().should.have.a.property( 'method' ).with.a.string( "returning a value" );

            } );

            it( 'accepts a method reference. export() evaluates the method and returns it as a property', function () {

                var Model = Backbone.Model.extend( {
                    initialize: function () { this.exportable = [ this.method ]; },
                    method: function () { return "returning a value"; }
                } );
                var model = new Model();

                model.export().should.have.a.property( 'method' ).with.a.string( "returning a value" );

            } );

            it( 'accepts an array of method names. export() evaluates all of them and returns them as properties', function () {

                var Model = Backbone.Model.extend( {
                    exportable: [ "method", "this.anotherMethod" ],
                    method: function () { return "returning a value"; },
                    anotherMethod: function () { return "returning another value"; }
                } );
                var model = new Model();

                model.export().should.have.a.property( 'method' ).with.a.string( "returning a value" );
                model.export().should.have.a.property( 'anotherMethod' ).with.a.string( "returning another value" );

            } );

            it( 'throws an error when one of the methods doesn\'t exist', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "missing",
                    method: function () { return "returning a value"; }
                } );
                var model = new Model();

                var exportFunction = _.bind( model.export, model );
                exportFunction.should.throw( Error, "Can't export \"missing\". The method doesn't exist" );

            } );

        } );

        describe( 'The onExport() handler', function () {

            it( 'is run by export(). It receives a hash of the model properties - the toJSON() data - as an argument', function () {

                var Model = Backbone.Model.extend( {} );
                var model = new Model();
                sinon.spy( model, "onExport" );

                model.set( { property: "a value", anotherProperty: "another value" } );
                var propHash = model.toJSON();

                model.export();
                model.onExport.should.have.been.calledWithExactly( propHash );

            } );

            it( 'receives the properties hash last, ie after the methods marked as "exportable" have been transformed into properties of the hash', function () {

                var Model = Backbone.Model.extend( {
                    exportable: "method",
                    method: function () { return "method return value"; }
                } );
                var model = new Model();
                sinon.spy( model, "onExport" );

                model.export();
                model.onExport.should.have.been.calledWithExactly( { method: "method return value" } );

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

        } );

        describe( 'The onBeforeExport() handler', function () {

            it( 'is run when export() is called', function () {

                var Model = Backbone.Model.extend( {} );
                var model = new Model();
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

                var Model = Backbone.Model.extend( {} );
                var model = new Model();
                sinon.spy( model, "onBeforeExport" );
                sinon.spy( model, "onExport" );

                model.export();
                model.onBeforeExport.should.have.been.calledBefore( model.onExport );

            } );

        } );

        describe( 'The onAfterExport() handler', function () {

            it( 'is run when export() is called', function () {

                var Model = Backbone.Model.extend( {} );
                var model = new Model();
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

                var Model = Backbone.Model.extend( {} );
                var model = new Model();
                sinon.spy( model, "onAfterExport" );
                sinon.spy( model, "onExport" );

                model.export();
                model.onAfterExport.should.have.been.calledAfter( model.onExport );

            } );

        } );

    } );

})();
