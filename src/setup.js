var slinky = {
    isClient: false,
    isServer: false
};

function noop() {}
function defaultCallback() {}
function getInsertIndex(attr, val, html) {
    var regex = new RegExp('<[^<]*' + attr + '+=["||\']' + val + '["||\']+.*?>');
    return html.match(regex);
}

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