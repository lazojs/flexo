var slinky = {
    isClient: false,
    isServer: false
};
var noop = function () {};

try {
    window;
    slinky.isClient = true;
} catch (e) {
    slinky.isServer = true;
}

if (slinky.isServer) {
    Backbone.View.prototype._ensureElement = noop;
    Backbone.View.prototype.delegateEvents = noop;
    Backbone.View.prototype.undelegateEvents = noop;
}