<h1>
  flexo
  <a title='Build Status' href="https://travis-ci.org/lazojs/flexo">
    <img src='https://travis-ci.org/lazojs/flexo.svg' />
  </a>
</h1>

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
defaults and the proper hook points that allow developers to add their own implementations for
resolving their dependencies and rendering.

Additionally, Flexo is able to run on both the server and client because it uses string
concatenation to render Flexo collection views. Any Flexo view can also get the HTML for itself.

Flexo is not a complete solution. It is intended to be a base for creating your own views by
providing structure and asynchronous rendering life cycles. It should be part of a larger
solution and your application.

## API
There are default implementations for all methods. These implementations can be overwritten to meet your
needs. [View Documentation](docs/index.md)