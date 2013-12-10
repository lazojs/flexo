# flexo

> Nah, I'm just messin' with ya; you're all right.

Backbone based libraries and frameworks typically have synchronous rendering life cycles.
This does not lend itself well to applications that have asynchronous rendering life cycles.
It also makes the assumption that all resources – templates, template engines, data, etc. –
have been resolved before a view’s rendering life cycle begins. This does not work
well in applications where rendering nodes can be added at runtime on the client, e.g., an
item is added to a collection that is driving a collection view. Synchronous rendering life
cycles also make it impossible to work with rendering and template engines that are
asynchronous, and make animating item view adds and removals from the DOM difficult.

Flexo, solves this by providing a 100% asynchronous rendering life cycle with sensible
defaults and the proper hook points that allow developers add their own implementations for
resolving their dependencies and rendering.

Additionally, Flexo is able to run on both the server and client because it uses string
concatenation to render Flexo collection views. Any Flexo view can also get the HTML for itself.

Flexo is not a complete solution. It is intended to be a base for creating your own views by
providing structure and asynchronous rendering life cycles. It should be part of a larger
solution and your application.

## API
There are default implementations for all methods. The majority of examples below show these
implementations for reference purposes. These implementations can be overwritten to meet your
needs.

### flexo.View

#### `render([callback])`
Proxies to getInnerHtml and injects response in $el. Returns HTML string to optional callback.
```javascript
view.render(function (html) {
    // do something cool after render
});
```

#### `attach`
Attaches a view to the element with corresponding cid in the DOM. Useful for attaching views to
server rendered markup.
```javascript
view.attach();
```

#### `afterRender`
Called after render injects HTML into the DOM. Useful for kicking off client side code like widgets.
```javascript
var View = flexo.View.extend({

    afterRender: function () {
        // DOM manipulations go here
    }

});
```

#### `onRemove`
Called after a view has beened removed from the DOM.
```javascript
var View = flexo.View.extend({

    onRemove: function () {
        // clean up my mess
    }

});
```

#### `onAttach`
Called after a view has been attached to the DOM.
```javascript
var View = flexo.View.extend({

    onAttach: function () {
        // i was just attached to an element in the DOM
    }

});
```

#### `remove`
Removes a view from the DOM. Calls onRemove then `Backbone.View.prototype.remove`.
```javascript
view.remove();
```

#### `getHtml([callback])`
Gets the HTML representation of the view including $el.
```javascript
view.getHtml(function (html) {
    // do something cool with the html
});
```

#### `getInnerHtml([callback])`
Gets the HTML representation of the view exlcuding $el.
```javascript
view.getInnerHtml(function (html) {
    // do something cool with the html
});
```

#### `getRenderer(callback)`
Used to get and wrap the rendering engine in the flexo interface rendering interface.
```javascript
// default implementation, but this could return an interface, `view.renderer.execute`
// that wraps anything that returns a string
var View = flexo.View.extend({

    getRenderer: function (callback) {
        if (this.renderer) {
            callback(this.renderer);
        }

        var self = this;
        this.getRenderingEngine(function (engine) {
            var compiledTemplate = engine(self.template);
            self.renderer = {
                execute: function (context, callback) {
                    callback(compiledTemplate(context));
                }
            };

            callback(self.renderer);
        });
    }

});
```

#### `getRenderingEngine(callback)`
Gets the rendering engine module.
```javascript
// default implementation, but this could return any template compiler or renderer that returns a string.
var View = flexo.View.extend({

    getRenderingEngine: function (callback) {
        callback(_.template);
    }

});
```

#### `serializeData(callback)`
Serializes the data for a view.
```javascript
// default implementation, but this could return any JSON data structure your heat desires.
var View = flexo.View.extend({

    serializeData: function (callback) {
        var data = this.model ? this.model.toJSON() : {};
        this.transformData(data, function (data) {
            callback(data);
        });
    }

});
```

#### `transformData(callback)`
A hook point for transforming the data from serializeData, e.g., formatting dates.
```javascript
// default implementation, but this could manipulate the serialized data into anything
var View = flexo.View.extend({

    transformData: function (callback) {
        return callback(data);
    }

});
```

### flexo.CollectionView

Extends flexo.View. Renders 1 to *n* collections. Surrounding markup is optional when only
rendering a single collection.

#### `getCollection(nameCollection, callback)`
If nameCollection is a string then it proxies resolveCollection. Otherwise it returns collection
via callback.

#### `resolveCollection(name, callback)`
Looks up collection by name.
```javascript
// default implementation, but this could use any logic to find a collection by name
var View = flexo.View.extend({

    resolveCollection: function (name, callback) {
        try {
            // attempts to lookup collection in 'collections' view property
            var collection = this.collections[name];
            callback(collection);
        } catch (e) {
            callback(new Backbone.Collection());
        }
    },

    collections: { // example collections property
        foo: collectionInstance,
        bar: collectionInstance
    }

});
```

#### `getItemView(model, collection, callback)`
Gets item view constructor.
```javascript
// default implementation, but this could use any logic to get an item view constructor
// eventually this will and should throw an error if the view constructor cannot be resolved
var View = flexo.View.extend({

     getItemView: function (model, collection, callback) {
        try {
            var View = this.itemViews[this._findCollection(collection).name];
        } catch (e) {
            var View = flexo.View.extend({
                template: ''
            });
        } finally {
            callback(View);
        }
    },

    itemViews: { // example itemViews property
        foo: ViewClassForFooCollection,
        bar: ViewClassForBarCollection
    }

});
```

#### `getEmptyView(collection, callback)`
Gets empty view constructor.
```javascript
// default implementation, but this could use any logic to get an empty view constructor
// eventually this will and should throw an error if the view constructor cannot be resolved
var View = flexo.View.extend({

    getEmptyView: function (collection, callback) {
        try {
            var View = this.emptyViews[this._findCollection(collection).name];
        } catch (e) {
            var View = flexo.View.extend({
                template: ''
            });
        } finally {
            callback(View);
        }
    },

    emptyViews: { // example emptyViews property
        foo: ViewClassForEmptyFooCollection,
        bar: ViewClassForEmptyBarCollection
    }

});
```

#### `addItemView($target, view, callback)`
Called when a model is added to a collection.
```javascript
// default implementation appends view to target element
var View = flexo.View.extend({

    addItemView: function ($target, view, callback) {
        $target.append(view.$el);
        callback();
    }

});
```

#### `addEmptyView($target, view, callback)`
Called when an empty collection is rendered.
```javascript
// default implementation appends view to target element
var View = flexo.View.extend({

    addEmptyView: function ($target, view, callback) {
        $target.append(view.$el);
        callback();
    }

});
```

#### `removeEmptyView($target, view, callback)`
Removes empty view from target.
```javascript
// default implementation calls view.remove()
var View = flexo.View.extend({

    removeEmptyView: function ($target, view, callback) {
        view.remove();
        callback();
    }

});
```

#### `removeItemView($target, view, callback)`
Removes item view from target.
Removes empty view from target.
```javascript
// default implementation calls view.remove()
var View = flexo.View.extend({

    removeItemView: function ($target, view, callback) {
        view.remove();
        callback();
    }

});
```

#### `renderCollection(collection, callback)`
Renders a collection if name or collection object is passed. Otherwise it renders all
collections.
```javascript
// render all collections
view.renderCollection(null, function () {
    // do something cool
});
// render collection named foo
view.renderCollection('foo', function () {
    // do something cool
});
```

## Events
TODO