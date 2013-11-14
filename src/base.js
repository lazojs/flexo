var View = Backbone.View.extend({

    constructor: function (options) {
        options || (options = {});
        _.extend(this, options);
        this.isServer = slinky.isServer;
        this.isClient = slinky.isClient;
        this._ensureElement();
        this.initialize.apply(this, arguments);
        this.delegateEvents();
    },

    render: function (callback) {
        var self = this;
        callback = callback || defaultCallback;
        if (this.isServer) {
            return callback('');
        }

        this.getInnerHtml(function (html) {
            self.$el.html(html);
            callback(html);
        });
    },

    attach: function (el) {
        this.setElement(el);
        this.onAttach();
    },

    afterRender: function () {},

    onRemove: function () {},

    onAttach: function () {},

    remove: function () {
        this.onRemove();
        Backbone.View.prototype.remove.call(this);
        return this;
    },

    getHtml: function (callback) {
        var self = this;
        callback = callback || defaultCallback;

        this.getInnerHtml(function (innerHtml) {
            callback(self._wrapperEl(innerHtml));
        });
    },

    getInnerHtml: function (callback) {
        var self = this;
        callback = callback || defaultCallback;

        this.getRenderer(function (renderer) {
            self.serializeData(function (data) {
                renderer.execute(data, callback);
            });
        });
    },

    getRenderer: function (callback) {
        callback = callback || defaultCallback;
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
    },

    getRenderingEngine: function (callback) {
        callback = callback || defaultCallback;
        callback(_.template);
    },

    serializeData: function (callback) {
        var data = this.model ? this.model.toJSON() : {};
        callback = callback || defaultCallback;
        this.transformData(data, function (data) {
            callback(data);
        });
    },

    transformData: function (data, callback) {
        callback = callback || defaultCallback;
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