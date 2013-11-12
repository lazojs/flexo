var slinky = (function (global, Backbone, _) {

    'use strict';

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

    var Base = Backbone.View.extend({
    
        constructor: function (options) {
            this.isServer = slinky.isServer;
            this.isClient = slinky.isClient;
            this._ensureElement();
            this.initialize.apply(this, arguments);
            this.delegateEvents();
        },
    
        render: function (callback) {
            if (this.isServer) {
                return callback('');
            }
    
            this.getInnerHtml(function (html) {
                this.$el.html(html);
                callback(html);
            });
        },
    
        attach: function () {
            this.trigger('attach');
            this.onAttach();
        },
    
        afterRender: function () {},
    
        onRemove: function () {},
    
        onAttach: function () {},
    
        remove: function () {
            Backbone.View.prototype.remove.call(this);
            this.trigger('remove');
            this.onRemove();
            return this;
        },
    
        getHtml: function (callback) {
            return this._wrapperEl(this.getInnerHtml(callback));
        },
    
        getInnerHtml: function (callback) {
            var self = this;
    
            this.getRenderer(function (renderer) {
                self.serializeData(function (data) {
                    renderer.execute(data, callback);
                });
            });
        },
    
        getRenderer: function (callback) {
            if (this.renderer) {
                callback(renderer);
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
        },
    
        getRenderingEngine: function (callback) {
            callback(_.template);
        },
    
        serializeData: function (callback) {
            this.transformData(data, function (data) {
                callback(data);
            });
        },
    
        transformData: function (data, callback) {
            return callback(data);
        },
    
        _wrapperEl: function (html) {
            var elHtmlOpen;
            var elHtmlClose;
            var attrsStr = '';
            var attrs = this._getAttributes();
    
            _.each(attrs, function (val, key) {
                attrsStr += ' ' + key + '="' + val + '"';
            });
    
            elHtmlOpen = '<' + _.result(this, 'tagName') + attrsStr + '>';
            elHtmlClose = '</' + _.result(this, 'tagName') + '>';
    
            return elHtmlOpen + html + elHtmlClose;
        },
    
        _getAttributes: function () {
            var attrs = _.result(this, 'attributes');
            if (this.id) {
                attrs.id = _.result(this, 'id');
            }
            if (this.className) {
                attrs['class'] = _.result(this, 'className');
            }
    
            return attrs;
        }
    
    });
    slinky.Base = Base;

    var Collection = Base.extend({
    
    });
    slinky.Collection = Collection;

    return slinky;

})(this, Backbone, _);