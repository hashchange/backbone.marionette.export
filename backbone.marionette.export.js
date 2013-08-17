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
 * - a reference to a method when it is possible, e.g in the initialize method:
 *         var model = Backbone.Model.extend({
 *             initialize: function(){
 *                 this.exportable = [ this.foo, this.bar ];
 *             }
 *         });
 *   Assignment by reference is not recommended, though, because it can easily trip you up. The gotchas:
 *
 *   - The reference assigned to to `this.exportable` MUST be wrapped in an array. Without an array, the method might be
 *     picked up under the wrong method name, "exportable". Any mistake will be difficult to spot because the behaviour
 *     depends on the browser (for instance, it worked ok in headless testing with PhantomJS, but failed in Chrome).
 *
 *     So don't ever do this: `initialize: function(){ this.exportable = this.foo; }`.
 *
 *   - The reference can't be assigned before the model instance is available. Do it in `initialize()`. By constrast,
 *     this won't work: `var model = Backbone.Model.extend({ exportable: this.foo });`.
 *
 * ...
 */
( function( Backbone ) {
    "use strict";

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
    Backbone.Model.prototype.onAfterExport = Backbone.Collection.prototype.onBeforeExport = function () {
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
        var data, exportable;

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

                } else if ( _.isFunction( method ) ) {

                    // Get the method name from the reference.
                    name = _.find(
                        _.functions( this ),
                        function ( name ) {
                            return this[name] === method;
                        },
                        this
                    );

                } else {
                    throw new Error( "'exportable' property: Invalid method identifier" );
                }

                if ( this instanceof Backbone.Collection ) {

                    // Collection:
                    // The exported collection is simply an array (of models). If any methods or properties of the
                    // collection itself are to be exported, they get transferred to a 'meta' property which is
                    // created on the array object.
                    //
                    // The exported methods are not attached to the array object directly, as top-level properties,
                    // because their names could clash with those of native array properties/methods.
                    if ( !data.meta ) data.meta = {};
                    data.meta[name] = method.apply( this );

                } else if ( _.isFunction( method ) ) {

                    // Model: Only act on a real method. If `method` is a reference to a property, just move on. Model
                    // properties are passed to the templates anyway.
                    data[name] = method.apply( this );

                }

            }, this );
        }

        // Run the onExport hander to modify/finalize the data if needed.
        if ( this.onExport ) data = this.onExport( data );

        // Trigger the onAfterExport handler just before returning.
        if ( this.onAfterExport ) this.onAfterExport();

        return data;
    };

    if ( Backbone.Marionette ) {

        Backbone.Marionette.ItemView.prototype.serializeData = function () {
            // Largely duplicating the original serializeData() method in Marionette.ItemView, but using Model.export
            // instead of Model.toJSON as a data source if Model.export is available.
            //
            // For the original code, taken from Marionette 1.0.4, see
            // https://github.com/marionettejs/backbone.marionette/blob/v1.0.4/src/marionette.itemview.js#L21

            var data = {};

            if (this.model) {
                data = this.model.export && this.model.export() || this.model.toJSON();
            }
            else if (this.collection) {
                data = { items: this.collection.export && this.collection.export() || this.collection.toJSON() };
                if ( data.items.meta ) _.extend( data, data.items.meta );
            }

            return data;
        };

    }

}( Backbone ));