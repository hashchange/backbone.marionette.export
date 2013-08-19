/**
 * Use case
 * ========
 *
 * Out of the box, templates handled by Marionette views have access to all properties of a model or collection, but
 * not to the output of its methods.
 *
 * With the enhancements here,
 *
 * - you can select model/collection methods to have their output available in any template, under the name of the method
 * - you can also modify the data before it is handed to a template, by implementing an `onExport` handler
 * - you can manipulate the model or collection state itself before it is passed to a template, using an `onBeforeExport`
 *   handler.
 * - you can clean up by implementing the `onAfterEport` handler.
 *
 * Example:
 *
 * ...
 *
 * Dependencies
 * ============
 *
 * Backbone is the only dependency. It makes most sense to use the enhancements with Marionette views, though.
 * If present, Marionette is modified to respond to the export() functionality, and Marionette views pass the exported
 * properties to the templates automatically.
 *
 * Loading
 * =======
 *
 * Just include this script after Backbone and Marionette (if you use Marionette) are loaded. In case you use require.js,
 * add script to shim and describe it in the requirements.
 *
 * Usage
 * =====
 *
 * ...
 *
 *
 * The `exportable` property accepts
 *
 * - a method name as a string:
 *         var model = Backbone.Model.extend({ exportable: "foo" });
 *         var model = Backbone.Model.extend({ exportable: "this.foo" });
 *
 * - an array of names:
 *         var model = Backbone.Model.extend({ exportable: ["foo", "this.bar"] });
 *
 * With models, only methods can be marked as exportable. Collections, by contrast, also accept names of (non-function)
 * properties.
 *
 * ...
 */
( function( Backbone, _ ) {
    "use strict";

    /**
     * Captures all properties of an object, all the way up the prototype chain. Returns them as an array of property
     * names.
     *
     * Code lifted from the MDC docs, http://goo.gl/hw2h4G
     *
     * @param obj
     * @returns string[]
     */
    function listAllProperties ( obj ) {

        var objectToInspect;
        var result = [];

        for ( objectToInspect = obj; objectToInspect !== null; objectToInspect = Object.getPrototypeOf( objectToInspect ) ) {
            result = result.concat( Object.getOwnPropertyNames( objectToInspect ) );
        }

        return _.unique( result );
    }

    // Capture all native array properties.
    var nativeArrayProperties =  listAllProperties( [] );

    /**
     * Is called before export(). Use it to manipulate or add state before export. No-op by default, implement as
     * needed.
     */
    Backbone.Model.prototype.onBeforeExport = Backbone.Collection.prototype.onBeforeExport = function () {
        // noop by default.
    };

    /**
     * Is called after export(). No-op by default, implement as needed.
     */
    Backbone.Model.prototype.onAfterExport = Backbone.Collection.prototype.onAfterExport = function () {
        // noop by default.
    };

    /**
     * Is called on export and handed the data hash intended for export. It can manipulate or add to the data and must
     * return it afterwards.
     *
     * The method is a no-op by default, returns the data unmodified. Implement as needed.
     *
     * There is no need to call the methods which have been specified in options.export. They have already been baked
     * into properties and are part of the data hash. Rather, onExport is intended for calling methods with a arguments
     * (those can't be passed to options.export) and for more complex manipulation tasks.
     *
     * @param data
     */
    Backbone.Model.prototype.onExport = Backbone.Collection.prototype.onExport = function ( data ) {
        return data;
    };

    Backbone.Model.prototype.export = Backbone.Collection.prototype.export = function () {
        var data, exportable, conflicts;

        // Before all else, run the onBeforeExport handler.
        if ( this.onBeforeExport ) this.onBeforeExport();

        // Get the Model or Collection data just like Marionette does it.
        if ( this instanceof Backbone.Collection ) {

            // Collection: Map the array of models to an array of exported model hashes. This is the only thing
            // Marionette does, out of the box, except that it calls model.toJSON for the transformation.
            //
            // We use the enhancements of model.export instead. But still, we get no more than an array of model hashes
            // at this point.
            data = this.map( function ( model ) { return model.export(); } );

        } else {

            // Model: Get the model properties for export to the template. This is the only thing Marionette does, out
            // of the box.
            data = this.toJSON();

        }

        // Call the methods which are defined in the `exportable` property. Attach the result of each call to the
        // exported data, setting the property name to that of the method.
        if ( this.exportable ) {

            exportable = this.exportable;
            if ( ! _.isArray( exportable ) ) exportable = exportable ? [ exportable ] : [];

            _.each( exportable, function( method ) {

                var name;
                if ( _.isUndefined( method ) ) throw new Error( "Can't export method. Undefined method reference" );

                if ( _.isString( method ) ) {

                    // Normalize the method name and get the method reference from the name.
                    name = method.indexOf( "this." ) == 0 ? method.substr( 5 ) : method;
                    if ( ! this[name] ) throw new Error( "Can't export \"" + name + "\". The method doesn't exist" );
                    method = this[name];

                } else {
                    throw new Error( "'exportable' property: Invalid method identifier" );
                }

                if ( _.isFunction( method )) {

                    // Call the method and turn it into a property of the exported object.
                    data[name] = method.apply( this );

                } else {

                    if ( this instanceof Backbone.Model ) {

                        // Model: Only act on a real method. Here, `method` is a reference to an ordinary property, ie
                        // one which is not a function. Throw an error because a reference of that kind is likely to be
                        // a mistake, or else bad design.
                        //
                        // Model data must be created with Model.set and must not be handled here. It is captured by
                        // toJSON() and thus available to the templates anyway.
                        throw new Error( "'exportable' property: Invalid method identifier \"" + name + "\", does not point to a function" );

                    } else {

                        // Collection: Export an ordinary, non-function property. There isn't a native way to make a
                        // collection property avaialble to templates, so exporting it is legit.
                        data[name] = this[name];

                    }

                }

            }, this );
        }

        // Run the onExport hander to modify/finalize the data if needed.
        if ( this.onExport ) data = this.onExport( data );

        // Trigger the onAfterExport handler just before returning.
        if ( this.onAfterExport ) this.onAfterExport();

        // Collection:
        // The exported collection is simply an array (of model hashes). But the native array object is augmented with
        // properties created by the export.
        //
        // These properties must not be allowed to overwrite native array methods or properties. Check the exported
        // property names and throw an error if they clash with the native ones.
        if ( this instanceof Backbone.Collection ) {

            conflicts = _.intersection( nativeArrayProperties,  _.keys( data ) ) ;
            if ( conflicts.length ) {
                throw new Error( "Can't export a property with a name which is reserved for a native array property. Offending properties: " + conflicts );
            }

        }

        return data;
    };

    if ( Backbone.Marionette ) {

        Backbone.Marionette.ItemView.prototype.serializeData = function () {
            // Largely duplicating the original serializeData() method in Marionette.ItemView, but using Model.export
            // instead of Model.toJSON as a data source if Model.export is available. Ditto for Collection.export.
            //
            // For the original code, taken from Marionette 1.0.4, see
            // https://github.com/marionettejs/backbone.marionette/blob/v1.0.4/src/marionette.itemview.js#L21

            var data = {};

            if (this.model) {
                data = this.model.export && this.model.export() || this.model.toJSON();
            }
            else if (this.collection) {
                data = { items: this.collection.export && this.collection.export() || this.collection.toJSON() };
            }

            return data;
        };

    }

}( Backbone, _ ));