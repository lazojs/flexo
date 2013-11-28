# flexo

> Nah, I'm just messin' with ya; you're all right.

Backbone based libraries and frameworks typically have synchronous rendering life cycles.
This does not lend itself well to applications that have asynchronous rendering life cycles.
It also makes the assumption that all resources – templates, template engines, data, etc. –
have been resolved before a view’s rendering life cycle begins. This assumption does not work
well in applications where rendering nodes can be added at runtime on the client, e.g., an
item is added to a collection that is driving a collection view. Synchronous rendering life
cycles also make it impossible to work with rendering and template engines that are
asynchronous, and make animating item views adds and removals from the DOM difficult.

Flexo, solves this by providing a 100% asynchronous rendering life cycle with sensible
defaults and the proper hook points that allow developers add their own implementations for
resolving their dependencies and rendering.

Additionally, Flexo is able to run on both the server and client because it uses string
concatenation to render Flexo collection views. Any Flexo view can also get the HTML for itself.

Flexo is not a complete solution. It is intended to be a base for creating your own views by
providing structure and asynchronous rendering life cycles. It should be part of a larger
solution and your application.

## flexo.View

- render([callback])
Proxies to getInnerHtml and injects response in $el. Returns HTML string to optional callback.

- attach
Attaches a view to the element with corresponding cid in the DOM. Useful for attaching views to
server rendered markup.

- afterRender
Called after render injects HTML into the DOM. Useful for kicking off client side code like widgets.

- onRemove
Called after a view has beened removed from the DOM.

- onAttach
Called after a view has been attached to the DOM.

- remove
Removes a view from the DOM.

- getHtml([callback])
Gets the HTML representation of the view including $el.

- getInnerHtml([callback])
Gets the HTML representation of the view exlcuding $el.

- getRenderer([callback])
Used to get and wrap the rendering engine in the flexo interface rendering interface.

- getRenderingEngine([callback])
Gets the rendering engine module.

- serializeData([callback])
Serializes the data for a view.

- transformData([callback])
A hook point for transforming the data from serializeData, e.g., formatting dates.

## flexo.CollectionView

Extends flexo.View. Renders 1 to **n** collections. Surrounding markup is optional when only
rendering a single collection.

- getCollection(nameCollection, callback)

- resolveCollection(name, callback)

- getItemView(model, collection, callback)

- getEmptyView(collection, callback)

- addItemView($target, view, callback)

- addEmptyView($target, view, callback)

- removeEmptyView($target, view, callback)

- removeItemView($target, view, callback)

- renderCollection(collection, callback)
