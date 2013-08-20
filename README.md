# Backbone.Marionette.Export

Backbone.Marionette.Export is a plugin for [Backbone][1], and specifically targeted at [Marionette][2]. It makes the methods of models and collections available to templates.

## Setup

Include this script after Backbone and Marionette (if you use Marionette) are loaded.

## Use case

Out of the box, templates handled by Marionette views have access to all properties of a model, and to the array of models represented by a collection. But templates can't use the output of methods. 

To work around that, you could override the `toJSON` method in a model or collection, but that creates [its own set of problems][3]. Specifically, anything you change in `toJSON` will also get written back to the server on save.

Backbone.Marionette.Export does not cause any such side effects. After dropping it in, this is what you can do:

- Select which methods of a model, or of a collection, provide their output to templates.
- Modify the data before it is handed to a template, by implementing an `onExport` handler.
- Manipulate the model or collection state itself before it is passed to a template, using an `onBeforeExport`
  handler.
- Clean up by implementing an `onAfterEport` handler.

## Usage and examples

### The basics

Here is how it works, in its simplest form:
    
    <script id="item-view-template" type="text/x-handlebars-template">
        <p>Model method returns: {{foo}} </p>
    </script>

`...`

    var Model = Backbone.Model.extend ({
        exportable: "foo",                       // <-- this is the one line you have to add           
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

The collection data is provided to the template as it always is: in an `items` array. That is the [standard behaviour][4] of a Marionette ItemView and unrelated to Backbone.Marionette.Export. 

Besides being an array, `items` is an object like any other. Arbitrary properties can be added to it. And that is exactly what happened to the exported method, `foo`.

### Recursion

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

### Complex data wrangling

In case you have to change the model state, or collection state, before it is handed over to a template, you can do whatever you need to do with `onBeforeExport`. Implement it, and it will be called before the data export kicks in. 

Likewise, implement `onAfterExport` for any clean-up operations. When it is called, the data for templates is already finalized.

### Can I mark properties for export?

Yes. And no. 

Model properties, if they are relevant to a template, should really be model _attributes_. Those get passed to templates out of the box. So you shouldn't ever need to say `exportable: "someProperty"`, and in fact, you'll get an error thrown at you for trying. That is on purpose, to help you catch accidental assignments.

Collections, by contrast, don't have attributes, and they don't provide a native way to have a property show up in a template. So here, `exportable: "someProperty"` makes sense, and indeed it will work just fine.

### For which Marionette view types does it work?

TODO !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

- ItemView

### But I don't use Marionette!

The export functionality in models and collections is wired up with Marionette views and works out of the box. But you can use it in your own view types, too. 

When you grab model or collection data during render(), call `model.export()` or `collection.export()` instead of their `toJSON` counterparts. That's all there is to it.


## Dependencies

[Backbone][1] is the only dependency. It makes most sense to use the enhancements with Marionette views, though.
If present, Marionette is modified to respond to the export() functionality, and Marionette views pass the exported
properties to the templates automatically.

## Tests

Use [Bower][5] for bootstrapping the test environment. With Bower in place, open a command prompt _in the `tests` directory_ and run `bower install`. If you want to test against specific versions of Backbone or Marionette, edit `bower.json` first.

The test suite is run from `tests/index.html`.

## License

MIT.

[1]: http://backbonejs.org/ "Backbone.js"
[2]: https://github.com/marionettejs/backbone.marionette#readme "Marionette: a composite application library for Backbone.js"
[3]: http://stackoverflow.com/a/10653468/508355 "Stack Overflow: How to access a calculated field of a backbone model from handlebars template?"
[4]: https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.itemview.md#rendering-a-collection-in-an-itemview "Rendering A Collection In An ItemView"
[5]: http://bower.io/ "Bower: a package manager for the web"


[x7]: http://jquery.com/ "jQuery"
[x8]: http://underscorejs.org/ "Underscore"
