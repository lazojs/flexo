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

`flexo.CollectionView` extends [flexo.View](#FlexoView).

## Events

## Attributes