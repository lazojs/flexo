## FlexoView

`flexo.View` extends [Backbone.View](http://backbonejs.org/#View).


```js
var View = flexo.View.extend({

   template: '<p>Hello, <%=name%>.</p>',

   model: new Backbone.Model({ name: 'Jason' })

});

var view = new View();
```

### `constructor(options)`

Creates a new `FlexoView` instance.
You may override it if you need to perform some initialization while the instance is created.
The `FlexoView` constructor must be called though. If the view defines an initialize function, it will be
called when the view is first created.

#### Arguments
1. `options` *(Object)*: By default flexo will merge all options with the created instance. See [`augment`](#augment) for further details.

#### Example
```js
var view = new flexo.View({ name: 'my-awesome-view' });
console.log(view.name); // logs 'my-awesome-view'
```

### `render(options)`

Proxies to `getInnerHtml` and injects response in `$el`. Returns HTML string to optional success callback.

*Note - Should only be called on the client.*

#### Arguments
1. `options` *(Object)*: Passed to the function as the first param.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View({ name: 'my-awesome-view' });
view.render({
    success: function (html) {
        // do something after async rendering is complete
    },
    error: function (err) {
        throw err;
    }
});
```

### `augment(options)`

Augments the instance with the options passed during construction.

#### Arguments
1. `options` *(Object)*: Passed to the function as the first param.

#### Example
```js
var View = flexo.View.extend({
    augment: function (options) {
        // only merge specific options
        _.extend(this, _.pick(options, ['model', 'collection', 'el']));
    }
});
```

### `attach(el, options)`

Attaches view to the `el` parameter. Useful for attaching views to server rendered markup.

*Note - If overridden it must call `attachChildViews`.*

#### Arguments
1. `el` *(Object)*: DOM element.
1. `options` *(Object)*: Options for attach.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.attach(document.querySelector('body'), {
    success: function () {
        // do something after async attachment is complete
    },
    error: function (err) {
        throw err;
    }
});
```

### `attachChildViews(options)`

Attaches child views using view cid values in markup data attributes.

*Note - Called by `attach`.*

#### Arguments
1. `options` *(Object)*: Options for attachChildViews. Passed by `attach`.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.attachChildViews({
    success: function () {
        // do something after async attachment is complete
    },
    error: function (err) {
        throw err;
    }
});
```

### `afterRender()`

Called after render injects HTML into the DOM. Useful for kicking off client side code like widgets.

#### Example
```js
var View = flexo.View.extend({

    afterRender: function () {
        // DOM manipulations go here
    }

});
```

### `onRemove()`

Called after a view has been removed from the DOM.

#### Example
```js
var View = flexo.View.extend({

    onRemove: function () {
        // clean up my mess
    }

});
```

### `onAttach()`

Called after a view has been attached to the DOM.

#### Example
```js
var View = flexo.View.extend({

    onAttach: function () {
        // I was just attached to an element in the DOM
    }

});
```

### `getAttributes()`

Gets the attributes for the view `el`. Called by `setElement`.

*Note - If overridden it must return an object with the `this.attributeNameSpace + -view-id` = `view.cid` in
addition to any other proprties. The `cid` value is used for attaching child views.*

#### Example
```js
var view = new flexo.View();
view.getAttributes();
```

### `remove()`

Removes a view from the DOM. Calls `onRemove` then `Backbone.View.prototype.remove`.

#### Example
```js
var view = new flexo.View();
view.remove();
```

### `getHtml(options)`

Gets the HTML string representation of the view including `$el`.

#### Arguments
1. `options` *(Object)*: Options for getHtml.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.getHtml({
    success: function (html) {
        // do something after async HTML string is created
    },
    error: function (err) {
        throw err;
    }
});
```

### `getInnerHtml(options)`

Gets the HTML representation of the view exlcuding `$el`. Called by `render` and `getHtml`

#### Arguments
1. `options` *(Object)*: Options for getInnerHtml.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.getInnerHtml({
    success: function (html) {
        // do something after async HTML string is created
    },
    error: function (err) {
        throw err;
    }
});
```

### `getRenderer(options)`

Gets the rendering engine. Called by `getInnerHtml`. Default implementation calls `getTemplateEngine` and precompiles
view template, but `getRenderer` can be overridden to use any rendering engine that returns a string.

#### Arguments
1. `options` *(Object)*: Options for getRenderer.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.getRenderer({
    success: function (render) {
        // do something after async renderer is resolved
    },
    error: function (err) {
        throw err;
    }
});
```

### `getTemplateEngine(options)`

Gets the template enegine. Default engine is `_.template`. Is called by `getRenderer`.

#### Arguments
1. `options` *(Object)*: Options for getTemplateEngine.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.getTemplateEngine({
    success: function (engine) {
        // do something after async engine is resolved
    },
    error: function (err) {
        throw err;
    }
});
```

### `serializeData(options)`

Serializes the data for a view. Called by `getRenderer` `success` method, which is called by
the `getInnerHtml` `success` method.

#### Arguments
1. `options` *(Object)*: Options for serializeData.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.serializeData({
    success: function (data) {
        // do something after async engine is resolved
    },
    error: function (err) {
        throw err;
    }
});
```

### `transformData(options)`

Serializes the data for a view. Called by `serializeData` `success` method.

#### Arguments
1. `options` *(Object)*: Options for transformData.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.transformData({
    success: function (data) {
        // do something after async engine is resolved
    },
    error: function (err) {
        throw err;
    }
});
```

### `setElement()`

Sets `view.el` attributes after Backbone.prototype.setElement is called.

#### Example
```js
var view = new flexo.View();
view.setElement();
```

### `getChildren()`

Gets the child views.

#### Example
```js
var view = new flexo.View();
view.getChildren();
```

### `addChild(viewName, $target, options)`

Adds a child view to the $target parameter.

#### Arguments
1. `viewName` *(String)*: Name of child view to add.
2. `$target` *(Object)*: jQuery object to which to append the child view.
3. `options` *(Object)*: Options for addChild.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
var $target = $('.someClass');
view.addChild('childViewName', $target, {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `loadChild(viewName, options)`

Loads a child view returning either the `constructor` or a the view instance. Called by `addChild` on the client.

#### Arguments
1. `viewName` *(String)*: Name of child view to add.
2. `options` *(Object)*: Options for loadChild.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.loadChild('childViewName', {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `resolveChild(viewName, options)`

Resolves a child view during rendering. Called by `addChild` on the client and a private method as part of `getInnerHtml`.

#### Arguments
1. `viewName` *(String)*: Name of child view to add.
2. `options` *(Object)*: Options for resolveChild.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.resolveChild('childViewName', {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `appendChild($target, view, options)`

Appends child view to the DOM. Called by `addChild`.

#### Arguments
1. `$target` *(Object)*: jQuery object to which to append the child view.
2. `view` *(Object)*: Child view instance to append.
3. `options` *(Object)*: Options for appendChild.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.appendChild('childViewName', {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `getChildOptions(options)`

Gets child view options for constructing a child view instance.

#### Arguments
1. `options` *(Object)*: Options for getChildOptions.

#### Example
```js
var view = new flexo.View();
view.getChildOptions({ foo: 1 });
```

## FlexoCollectionView

`flexo.CollectionView` extends [flexo.View](#flexoview).

```js
var View = flexo.CollectionView.extend({

    template: '<ul flexo-collection-target="collection"></ul>',

    collection: new Backbone.Collection([
        { name: 'Jimmy' },
        { name: 'Robert' },
        { name: 'John' },
        { name: 'John Paul' }
    ])

    itemView: flexo.View.extend({
        tagName: 'li',
        template: '<%=name%>'
    })

});

var view = new View();
```

### `constructor(options)`

Creates a new `FlexoCollectionView` instance.
You may override it if you need to perform some initialization while the instance is created.
The `FlexoCollectionView` constructor must be called though. If the view defines an initialize function, it will be
called when the view is first created.

#### Arguments
1. `options` *(Object)*: By default flexo will merge all options with the created instance. See [`augment`](#augment) for further details.

#### Example
```js
var view = new flexo.CollectionView({ name: 'my-awesome-view' });
console.log(view.name); // logs 'my-awesome-view'
```

### `getCollection(nameCollection, options)`

Gets a collection by name or returns collection itself.

*Note - Called as part of `getInnerHtml`. Should not be overridden.*

#### Arguments
1. `nameCollection` *(Object or String)*: A collection instance or the name of a collection to resolve.
2. `options` *(Object)*: Options for getCollection.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.getCollection('collectionName', {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `resolveCollection(name, options)`

Resolves a collection by name. Called by `getCollection`.

#### Arguments
1. `name` *(String)*: The name of a collection to resolve.
2. `options` *(Object)*: Options for resolveCollection.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.resolveCollection('collectionName', {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `getItemView(model, collection, options)`

Resolves an item view by model and collection. Called indirectly by `getInnerHtml` as needed
during rendering.

#### Arguments
1. `model` *(Object)*: The model for the item view.
2. `collection` *(Object)*: The collection to which the model for the item view belongs.
3. `options` *(Object)*: Options for getItemView.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.getItemView(model, collection, {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `getEmptyView(collection, options)`

Resolves an empty view by collection. Called indirectly by `getInnerHtml` as needed
during rendering.

#### Arguments
1. `collection` *(Object)*: The collection to which the empty view belongs.
2. `options` *(Object)*: Options for getEmptyView.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.getEmptyView(collection, {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `addItemView($target, view, options)`

Resolves an empty view by collection. Called indirectly by `getInnerHtml` as needed
during rendering and when a model is added to a collection.

#### Arguments
1. `$target` *(Object)*: jQuery object to which to add the item view.
2. `view` *(Object)*: The view instance to add.
3. `options` *(Object)*: Options for addItemView.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.addItemView($target, view, {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `addEmptyView($target, view, options)`

Resolves an empty view by collection. Called indirectly by `getInnerHtml` as needed
during rendering and when a collection is empty.

#### Arguments
1. `$target` *(Object)*: jQuery object to which to add the empty view.
2. `view` *(Object)*: The view instance to add.
3. `options` *(Object)*: Options for addEmptyView.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.addEmptyView($target, view, {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `removeEmptyView($target, view, options)`

Called when a model is added to an empty collection.

#### Arguments
1. `$target` *(Object)*: jQuery object to which to remove the empty view.
2. `view` *(Object)*: The view instance to remove.
3. `options` *(Object)*: Options for removeEmptyView.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.removeEmptyView($target, view, {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `removeItemView($target, view, options)`

Called when a model is removed from a collection.

#### Arguments
1. `$target` *(Object)*: jQuery object to which to remove the item view.
2. `view` *(Object)*: The view instance to remove.
3. `options` *(Object)*: Options for removeItemView.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.removeItemView($target, view, {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `renderCollection(collection, options)`

Renders a collection. Called indirectly by `getInnerHtml` as needed
during rendering.

#### Arguments
1. `collection` *(Object)*: The collection to be rendered.
2. `options` *(Object)*: Options for renderCollection.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.renderCollection($target, view, {
    success: function () {
        // do something after child view is added to the DOM
    },
    error: function (err) {
        throw err;
    }
});
```

### `attachItemEmptyViews(options)`

Attaches item and empty views using view cid values in markup data attributes.

*Note - Called by `attach`.*

#### Arguments
1. `options` *(Object)*: Options for attachItemEmptyViews. Passed by `attach`.
    - `success` *(Function)*: Function to call when successful.
    - `error` *(Function)*: Function to call if there is a failure.

#### Example
```js
var view = new flexo.View();
view.attachItemEmptyViews({
    success: function () {
        // do something after async attachment is complete
    },
    error: function (err) {
        throw err;
    }
});
```

### `getItemViewOptions(type, [model], collection, options)`

Gets the options for item and empty views. Called by `createItemView` and `createEmptyView`.

#### Arguments
1. `type` *(String)*: The type of view, 'emptyView' or 'itemView'.
2. `model` *(Object)*: The model associated with the item view.
3. `collection` *(Object)*: The collection associated with the item or empty view.
4. `options` *(Object)*: Options for getItemViewOptions.

#### Example
```js
var view = new flexo.View();
view.getItemViewOptions('itemView', model, collection, { foo: true });
```

### `createItemView(View, model, collection)`

Gets the options for item and empty views. Called by `createItemView` and `createEmptyView`.

#### Arguments
1. `View` *(Function)*: Item view constructor.
2. `model` *(Object)*: The model associated with the item view.
3. `collection` *(Object)*: The collection associated with the item view.

#### Example
```js
var view = new flexo.View();
var itemView = view.createItemView(View, model, collection);
```

### `createEmptyView(View, collection)`

Gets the options for item and empty views. Called by `createEmptyView` and `createEmptyView`.

#### Arguments
1. `View` *(Function)*: EMpty view constructor.
2. `collection` *(Object)*: The collection associated with the empty view.

#### Example
```js
var view = new flexo.View();
var emptyView = view.createEmptyView(View, model, collection);
```

## Events
In addition to `on` functions, e.g., `onRemove` Flexo triggers events. The default namespace for these events is 'flexo'.
The default event namespace can be chnaged by setting the `eventNameSpace` property of a view.

* 'flexo:rendered' - when a view is rendered
* 'flexo:attached' - when a view is attached
* 'flexo:removed' - when a view is removed
* 'flexo:child:added' - when a child view is added
* 'flexo:itemView:added' - when an item view is added
* 'flexo:emptyView:added' - when an empty view is added
* 'flexo:itemView:removed' - when an item view is removed
* 'flexo:emptyView:removed' - when an empty view is removed
* 'flexo:collection:rendered' - when a collection is rendered
* 'flexo:itemViews:attached' - when item views are attached


## Attributes
Flexo adds sttibutes to the view markup such as a view's cid. The default namespace for these attributes is 'flexo'.
The default attribute namespace can be chnaged by setting the `attributeNameSpace` property of a view.