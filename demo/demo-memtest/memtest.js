( function ( Backbone, _, $ ) {
    "use strict";

    if ( !( this && this.console || window.console ) ) window.console = { log: function ( msg ) {} };

    var $log = $( "#log" ),
        $memtest = $( "#memtest" ),
        $submit = $memtest.find( "#runMemtest" ),

        $modelSetSize = $memtest.find( "#modelSetSize" ),
        $modelLoop = $memtest.find( "#modelLoop" ),
        $collectionLoop = $memtest.find( "#collectionLoop" ),

        $testTypes = $memtest.find( "#testTypes" ),
        getTestType = function () {
            return String( $testTypes.find( "input[name='testType']:checked" ).val() );
        },

        msg = function ( text, collection, models ) {
            collection || (collection = []);
            models || (models = []);

            var msg,
                collectionStatus = "    Length of collection: " + collection.length,
                modelStatus = "    Number of models: " + models.length,
                lf = "\n",
                br = "<br>";

            msg = text.replace( lf, br );
            if ( collection.length ) msg += br + collectionStatus;
            if ( models.length ) msg += br + modelStatus;

            console.log( msg.replace( br, lf ) );
            $log.append( msg + br );
        },

        waitCb = function ( collection, models ) {
            // NB Verify that collection, model and length props exist. Needed for for IE8.
            if ( collection && collection.length && models && models.length ) console.log( "WAIT output: collection.length=" + collection.length + ", models.length=" + models.length );
            msg( "WAIT has ended.\n" );
        },

        wait = function () {
            window.setTimeout( waitCb, 500, arguments[0], arguments[1] );
        },

        memtest = {};

    // NB, wait function:
    //
    // Don't use _.debounce, as in `wait = _.debounce( waitCb, 500 )`. It leaked memory like crazy in these tests, using
    // Underscore 1.5.2. I thought I had a leak, turned out I had been chasing ghosts for a couple of hours. Apparently
    // it has been fixed and merged months ago (jashkenas/underscore#1329, #1330), but still hasn't made it into a
    // release.

    $submit.click( function ( event ) {
        var modelSetSize = Number( $modelSetSize.val() ),
            modelLoop = Number( $modelLoop.val() ),
            collectionLoop = Number( $collectionLoop.val() );

        event.preventDefault();
        memtest.run( modelSetSize, modelLoop, collectionLoop, getTestType() );
    } );

    memtest.run = function ( modelSetSize, modelLoop, collectionLoop, testType ) {
        var i, j,
            Collection = Backbone.Collection.extend( {
                exportable: "bar",
                bar: function () {
                    return "bar";
                }
            } ),
            collection,
            Model = Backbone.Model.extend( {
            exportable: "foo",
            foo: function () {
                return "foo";
            }
        } ),
            models;

         switch ( testType ) {
            case "backbone":
                msg( "Testing Backbone with exportable methods (no onExport handler)" );
                break;

            case "backbone.onExport":
                msg( "Testing Backbone with exportable methods and onExport handler" );

                Model = Model.extend( {
                    onExport: function ( data ) {
                        data.baz = this.baz( "baz" );

                        return data;
                    },
                    baz: function ( arg ) {
                        return "baz called with arg: " + arg;
                    }
                } );

                Collection = Collection.extend( {
                    onExport: function ( data ) {
                        data.qux = this.qux( "baz" );
                        return data;
                    },
                    qux: function ( arg ) {
                        return "qux called with arg: " + arg;
                    }
                } );

                break;

            default:
                msg( "Invalid test type selected!!!" );
       }

        for ( i = 0; i < modelLoop; i++ ) {
            models = [];
            for ( j = 0; j < modelSetSize; j++ ) {
                models.push( new Model( { id: j, number: j + 1, caption: "I am model #" + ( j + 1 ) } ) );
            }
        }

        msg( i + " model sets are created.", undefined, models );

        collection = { close: function () {} };
        for ( i = 0; i < collectionLoop; i++ ) {
            collection = new Collection( models );
        }

        msg(
            i + " collections are created.",
            collection, models
        );

        msg( "Done.\n----\n" );

        // Prevent collection and models from being released too early by keeping the references around a bit. Should
        // ensure that the profiler captures memory spikes.
        wait( collection, models );

    }

}( Backbone, _, jQuery ));