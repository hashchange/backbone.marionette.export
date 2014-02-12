# Backbone.Marionette.Export

Backbone.Marionette.Export is a plugin for [Backbone][], and specifically targeted at [Marionette][]. It makes the methods of models and collections available to templates.

## Setup

Include backbone.marionette.export.js after Backbone and Marionette (if you use Marionette). The stable version of Backbone.Marionette.Export is available in the `dist` directory, including an AMD build. If you use Bower, fetch the files with `bower install backbone.marionette.export`.

If you need to handle deeply nested structures recursively, swap out Underscore for a compatible Lo-dash build with _.cloneDeep support. [See below](#enhanced-recursion-support-with-lo-dash-and-_clonedeep).

## Use case

Out of the box, templates handled by Marionette views have access to all properties of a model, and to the array of models represented by a collection. But templates can't use the output of methods. 

To work around that, you could override the `toJSON` method in a model or collection, but that creates [its own set of problems][1]. Specifically, anything you change in `toJSON` will also get written back to the server on save.

Backbone.Marionette.Export does not cause any such side effects. After dropping it in, this is what you can do:

- Select which methods of a model, or of a collection, provide their output to templates.
- Modify the data before it is handed to a template, by implementing an `onExport` handler.
- Manipulate the model or collection state itself before it is passed to a template, using an `onBeforeExport`
  handler.
- Clean up by implementing an `onAfterExport` handler.

## Usage and examples

### The basics

Here is how it works, in its simplest form:
    
    <script id="item-view-template" type="text/x-handlebars-template">
        <p>Model method returns: {{foo}} </p>
    </script>

`...`

    var Model = Backbone.Model.extend ({
        exportable: "foo",                 // <-- this is the one line you have to add
        foo: function () { 
            return "some calculated result of calling foo"; 
        }
    });
    
    var view = new Marionette.ItemView ({
        model: new Model(),
        template: "#item-view-template"
    });
    
    view.render();

In the model definition, you declare which methods are available to a template. Just provide the method name to `exportable`, or an array of them. For method names, both `"foo"` and `"this.foo"` are acceptable.

That works fine for simple method signatures. But what about **methods which take arguments**?

    <script id="item-view-template" type="text/x-handlebars-template">
        <p>Model method returns: {{foo}} </p>
    </script>

`...`

    var Model = Backbone.Model.extend ({     
    
        foo: function ( arg ) { 
            return "some calculated result of calling foo with " + arg; 
        },
    
        onExport: function ( modelHash ) {
            modelHash.foo = this.foo( someArg );
            return modelHash;
        }
    
    });
    
    var view = new Marionette.ItemView ({
        model: new Model(),
        template: "#item-view-template"
    });
    
    view.render();

In this scenario, there is no need to declare the method as `exportable`. In fact, you can't: the method takes arguments, so it can't be called automatically. Instead, modify the exported model data in an `onExport` handler. You can do pretty much anything there. Just remember to return the data at the end.

For a **collection**, the process is the same as for a model. 

    <script id="item-view-template" type="text/x-handlebars-template">
        <p>Collection method 'foo' returns: {{items.foo}} </p>
    </script>

`...`

    var Collection = Backbone.Collection.extend ({
        exportable: "foo",          
        foo: function () { return "some calculated result of calling foo"; }
    });
    
    var view = new Marionette.ItemView ({
        collection: new Collection(),
        template: "#item-view-template"
    });
    
    view.render();

The collection data is provided to the template as it always is: in an `items` array. That is the [standard behaviour][2] of a Marionette ItemView and unrelated to Backbone.Marionette.Export.

Besides being an array, `items` is an object like any other. Arbitrary properties can be added to it. And that is exactly what happened to the exported method, `foo`.

### Recursion

#### Baseline support

Now, suppose a collection is passed to a template. What if it is made up of models which, in turn, have methods marked for export to the template?

    <script id="item-view-template" type="text/x-handlebars-template">
        <p>Method 'foo' of the first item in the collection returns: {{items.first.foo}} </p>
        <p>Method 'foo' of the last item in the collection returns: {{items.last.foo}} </p>
    </script>

`...`

    var Model = Backbone.Model.extend ({
        exportable: "foo",          
        foo: function () { return "my cid is " + this.cid; }
    });
    
    var Collection = Backbone.Collection.extend ({
        exportable: [ "first", "last" ]              // <-- you can use it for built-in methods, too
    });
    
    var view = new Marionette.ItemView ({
        collection: new Collection( [ new Model(), new Model() ] ),
        template: "#item-view-template"
    });
    
    view.render();

The message here is that the plugin handles recursion for you, no matter of what kind. You can have a collection method return another, nested collection, which in turn holds models with methods marked for export. It all gets exported, just as you would expect, without any additional measures on your part.

#### Enhanced recursion support with Lo-dash and _.cloneDeep

In the default Backbone setup, recursion works fine as long as Backbone objects are nested directly within one another. If the chain is broken by other, non-Backbone objects in between, recursion stops. Consider these examples:

- A hypothetical `model.getInnerModel.getInnerCollection.getYetAnotherModel` will behave as expected. 
- By contrast, `model.getObjectLiteral.someProperty.innerBackboneModelHere` won't trigger a call to `export` on the inner model.

This limitation is imposed by the underlying utility library, [Underscore][]. Underscore [doesn't do deep cloning][3]. Handling deeply nested structures with Underscore can be full of surprises, mostly [unpleasant ones][4].

The good news is that deep cloning, and support for deep recursion, is easy to add. Just swap out Underscore for a fully compatible build of [Lo-dash][].

On the Lo-dash site, there are a number of builds to choose from, including one designed to replace Underscore with 100% compatibility, but it lacks support for deep cloning. You can [add it yourself][5], though, with a few commands in a terminal.

- Make sure you have [Node.js][] and npm working.
- Install Lo-dash globally with `npm install -g lodash`, and the CLI with `npm install -g lodash-cli`.
- Change into the directory where you want to put your Underscore replacement.
- Create the library with `lodash underscore plus=clone,cloneDeep`.
- Replace the Underscore script tag on your pages with one loading the new library.

With the Lo-dash build in place, deeply nested structures are no longer a problem. In the second example above, `model.getObjectLiteral.someProperty.innerBackboneModelHere` indeed triggers a call to `export` on the inner model, as one would expect.

#### Maximum recursion depth

Recursion can generate huge data structures in some cases, so it makes sense to impose a limit. By default, there won't be more than four recursive calls to `export` for a given top-level object. That should be more than enough for almost any template requirement.

You can change the limit globally in your project by setting `Backbone.Model.prototype.export.maxHops` and `Backbone.Collection.prototype.export.maxHops` to the desired recursion depth.

Circular dependencies between your models and collections are contained by the recursion limit, too.

### Complex data wrangling

In case you have to change the model state, or collection state, before the model is handed over to a template, you can do whatever you need to do with `onBeforeExport`. Implement it, and it will be called before the data export kicks in. 

Likewise, implement `onAfterExport` for any clean-up operations. When it is called, the data for templates is already finalized.

### Can I mark properties for export?

Yes. And no. 

Model properties, if they are relevant to a template, should really be model _attributes_. Those get passed to templates out of the box. So you shouldn't ever need to say `exportable: "someProperty"`, and in fact, you'll get an error thrown at you for trying. That is on purpose, to help you catch accidental assignments.

Collections, by contrast, don't have attributes, and they don't provide a native way to have a property show up in a template. So here, `exportable: "someProperty"` makes sense, and indeed it will work just fine.

### For which Marionette view types does it work?

All of them.

### But I don't use Marionette!

The export functionality in models and collections is wired up with Marionette views and works out of the box. But you can use it in your own view types, too. 

When you grab model or collection data during render(), call `model.export()` or `collection.export()` instead of their `toJSON` counterparts. That's all there is to it.


## Dependencies

[Backbone][] is the only dependency. It makes most sense to use the enhancements with Marionette views, though.
If present, Marionette is modified to respond to the export() functionality, and Marionette views pass the exported
properties to the templates automatically.

## Build process and tests

### Setup

[npm][] and [Bower][] set up the environment for you.

- The only thing you've got to have on your machine is [Node.js]. Download the installer [here][Node.js].
- Open a command prompt in the project directory.
- Run `npm install`.
- Run `bower install`.

Your test and build environment is ready now. If you want to test against specific versions of Backbone or Marionette, edit `bower.json` first.

### Running tests, creating a new build

The test tool chain: [Grunt][] (task runner), [Karma][] (test runner), [Mocha][] (test framework), [Chai][] (assertion library), [Sinon][] (mocking framework). The good news: you don't need to worry about any of this.

A handful of commands manage everything for you:

- Run the tests in a terminal with `grunt test`.
- Run the tests in a browser interactively, live-reloading the page when the source or the tests change: `grunt interactive`.
- Build the dist files (also running tests and linter) with `grunt build`, or just `grunt`.
- Build continuously on every save with `grunt ci`.
- Change the version number throughout the project with `grunt setver --to=1.2.3`. (Remember to rebuild the project with `grunt` afterwards.)

Finally, if need be, you can set up a quick demo page to play with the code. First, edit the files in the `demo` directory. Then display `demo/index.html`, live-reloading your changes to the code or the page, with `grunt demo`. Libraries needed for the demo/playground should go into the Bower dev dependencies, in the project-wide `bower.json`, or else be managed by the dedicated `bower.json` in the demo directory.

_The `grunt interactive` and `grunt demo` commands spin up a web server, opening up the **whole project** to access via http. By default, that access is restricted to localhost. You can relax the restriction in `Gruntfile.js`, but be aware of the security implications._

### Changing the tool chain configuration

In case anything about the test and build process needs to be changed, have a look at the following config files:

- `karma.conf.js` (changes to dependencies, additional test frameworks)
- `Gruntfile.js`  (changes to the whole process)
- `web-mocha/_index.html` (changes to dependencies, additional test frameworks)

New test files in the `spec` directory are picked up automatically, no need to edit the configuration for that.

## License

MIT.

Copyright (c) 2014 Michael Heim.

[Backbone]: http://backbonejs.org/ "Backbone.js"
[Marionette]: https://github.com/marionettejs/backbone.marionette#readme "Marionette: a composite application library for Backbone.js"
[Underscore]: http://underscorejs.org/ "Underscore"
[Lo-dash]: http://lodash.com/ "Lo-Dash"
[Node.js]: http://nodejs.org/ "Node.js"
[Bower]: http://bower.io/ "Bower: a package manager for the web"
[npm]: https://npmjs.org/ "npm: Node Packaged Modules"
[Grunt]: http://gruntjs.com/ "Grunt: The JavaScript Task Runner"
[Karma]: http://karma-runner.github.io/ "Karma - Spectacular Test Runner for Javascript"
[Mocha]: http://visionmedia.github.io/mocha/ "Mocha - the fun, simple, flexible JavaScript test framework"
[Chai]: http://chaijs.com/ "Chai: a BDD / TDD assertion library"
[Sinon]: http://sinonjs.org/ "Sinon.JS - Versatile standalone test spies, stubs and mocks for JavaScript"
[JSHint]: http://www.jshint.com/ "JSHint, a JavaScript Code Quality Tool"

[1]: http://stackoverflow.com/a/10653468/508355 "Stack Overflow: How to access a calculated field of a backbone model from handlebars template?"
[2]: https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.itemview.md#rendering-a-collection-in-an-itemview "Rendering A Collection In An ItemView"
[3]: https://github.com/jashkenas/underscore/pull/595 "Underscore Pull Request #595: Deep copying with _.clone(obj, deep)"
[4]: http://coding.smashingmagazine.com/2013/08/09/backbone-js-tips-patterns/ "Backbone.js Tips And Patterns: Perform Deep Copies Of Objects"
[5]: https://github.com/bestiejs/lodash/issues/206 "lodash Issue #206: Underscore compatibility"
