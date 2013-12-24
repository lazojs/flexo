var View = Backbone.View.extend({

    constructor: function (options) {
        options || (options = {});
        _.extend(this, options);
        this.isServer = flexo.isServer;
        this.isClient = flexo.isClient;
        this.cid = _.uniqueId('view');
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
            self.afterRender();
            callback(html);
        });
    },

    attach: function () {
        this.setElement($('[flexo-view="' + this.cid + '"]')[0]);
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
                renderer.execute(data, function (html) {
                    self.getChildViewsHtml(html, function (html) {
                        callback(html);
                    });
                });
            });
        });
    },

    getRenderer: function (callback) {
        callback = callback || defaultCallback;
        if (this.renderer) {
            return callback(this.renderer);
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

    setElement: function () { // set view el attributes after bb.prototype.setElement is called
        var response = Backbone.View.prototype.setElement.apply(this, arguments);
        this._setElAttributes(_.extend(this._getAttributes(), this._getFlexoAttributes()));
        return response;
    },

    getChildViewsHtml: function (htmlBuffer, callback) {
        var self = this;

        this.getChildViews(function (views) {
            var viewCount = views ? _.size(views) : 0;
            var viewsLoaded = 0;
            if (!viewCount) {
                return callback(htmlBuffer);
            }

            _.each(views, function (view, key) {
                self.resolveChildView(key, function (view) {
                    view.getHtml(function (html) {
                        htmlBuffer = insertIntoHtmlStr('flexo-child-view', key, html, htmlBuffer);
                        viewsLoaded++;
                        if (viewsLoaded === viewCount) {
                            callback(htmlBuffer);
                        }
                    });
                });
            });
        });
    },

    getChildViews: function (callback) {
        callback(_.result(this, 'childViews'));
    },

    addChild: function (viewName, $target, callback) {
        var self = this;
        this.loadChildView(viewName, function (View) {
            self.getChildViewOptions(function (options) {
                self._childViews[viewName] = new View(options);
                view.render();
                self.appendChildView($target, view, callback);
            });
        });
    },

    loadChildView: function (viewName, callback) {
        callback(Backbone.View);
    },

    resolveChildView: function (viewName, callback) {
        var view = this._childViews[viewName];
        var View;
        var self = this;
        if (view) {
            return callback(view);
        }

        if (!(View = this.childViews[viewName])) {
            throw 'Child view, ' + viewName + ' could not be resolved.';
        }
        this.getChildViewOptions(function (options) {
            view = self._childViews[viewName] = new View(options);
            callback(view);
        });
    },

    appendChildView: function ($target, view, callback) {
        $target.append(view.$el);
        callback();
    },

    getChildViewOptions: function (callback) {
        callback(_.clone(this.childViewOptions || {}));
    },

    _childViews: {},

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

    _setElAttributes: function (attrs) {
        if (!this.isServer) {
            this.$el.attr(attrs);
        }
    },

    _getAttributes: function () {
        var attrs = _.extend({}, _.result(this, 'attributes'));

        if (this.id) {
            attrs.id = _.result(this, 'id');
        }
        if (this.className) {
            attrs['class'] = _.result(this, 'className');
        }

        return _.extend(attrs, this._getFlexoAttributes());
    },

    _getFlexoAttributes: function () {
        return {
            'flexo-view': this.cid
        };
    }

});