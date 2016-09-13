({
    mainConfigFile: "../../../require-config.js",
    optimize: "none",
    name: "local.main",
    exclude: [
        "jquery",
        "underscore",
        "backbone",
        "backbone.radio",
        "marionette",
        "backbone.marionette.export"
    ],
    out: "../../output/parts/app.js"
})