;( function ( root, factory ) {
    if ( typeof exports === 'object' ) {

        var underscore = require( 'underscore' );
        var backbone = require( 'backbone' );
        var marionette = require( 'marionette' );

        module.exports = factory( underscore, backbone, marionette );

    } else if ( typeof define === 'function' && define.amd ) {

        define( ['underscore', 'backbone', 'marionette'], factory );

    }
}( this, function ( _, Backbone ) {
    "option strict";

    // @include backbone.marionette.export.js

} ));

