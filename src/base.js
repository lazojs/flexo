var View = Backbone.View.extend({

    childViewOptions: {},

    constructor: function (options) {
        this.augment(options || (options = {}));
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
            return callback(null, '');
        }

        this.getInnerHtml(function (err, html) {
            if (err) {
                return callback(err, null);
            }
            self.$el.html(html);
            self.afterRender();
            callback(null, html);
            self.trigger('flexo:rendered', self);
        });
    },

    augment: function (options) {
        _.extend(this, options);
    },

    attach: function () {
        this.setElement($('[flexo-view="' + this.cid + '"]')[0]);
        this.onAttach();
        this.trigger('flexo:attached', self);
    },

    afterRender: function () {},

    onRemove: function () {},

    onAttach: function () {},

    remove: function () {
        this.onRemove();
        Backbone.View.prototype.remove.call(this);
        this.trigger('flexo:removed');
        return this;
    },

    getHtml: function (callback) {
        var self = this;
        callback = callback || defaultCallback;

        this.getInnerHtml(function (err, innerHtml) {
            if (err) {
                return callback(err, null);
            }
            callback(null, self._wrapperEl(innerHtml));
        });
    },

    getInnerHtml: function (callback) {
        var self = this;
        callback = callback || defaultCallback;

        this.getRenderer(function (err, renderer) {
            if (err) {
                return callback(err, null);
            }
            self.serializeData(function (err, data) {
                if (err) {
                    return callback(err, null);
                }
                renderer(data, function (err, html) {
                    if (err) {
                        return callback(err, null);
                    }
                    self.getChildViewsHtml(html, function (err, html) {
                        callback(null, html);
                    });
                });
            });
        });
    },

    getRenderer: function (callback) {
        callback = callback || defaultCallback;
        if (this.renderer) {
            return callback(null, this.renderer);
        }

        var self = this;
        this.getTemplateEngine(function (err, engine) {
            if (err) {
                return callback(err, null);
            }
            var compiledTemplate = engine(self.template);
            self.renderer = function (context, callback) {
                var renderedTemplate = compiledTemplate(context);
                try {
                    renderedTemplate = compiledTemplate(context);
                    callback(null, compiledTemplate(context));
                } catch (err) {
                    callback(err, null);
                }
            };

            callback(null, self.renderer);
        });
    },

    getTemplateEngine: function (callback) {
        callback = callback || defaultCallback;
        callback(null, _.template);
    },

    serializeData: function (callback) {
        var data = this.model ? this.model.toJSON() : {};
        callback = callback || defaultCallback;
        this.transformData(data, function (err, data) {
            if (err) {
                return callback(err, null);
            }
            callback(null, data);
        });
    },

    transformData: function (data, callback) {
        callback = callback || defaultCallback;
        return callback(null, data);
    },

    setElement: function () { // set view el attributes after bb.prototype.setElement is called
        var response = Backbone.View.prototype.setElement.apply(this, arguments);
        this._setElAttributes(_.extend(this._getAttributes(), this.getAttributes()));
        return response;
    },

    getChildViewsHtml: function (htmlBuffer, callback) {
        var self = this;

        this.getChildViews(function (err, views) {
            var viewCount = views ? _.size(views) : 0;
            var viewsLoaded = 0;
            if (!viewCount) {
                return callback(null, htmlBuffer);
            }

            _.each(views, function (view, key) {
                self.resolveChildView(key, function (err, view) {
                    if (err) {
                        return callback(err, null);
                    }
                    view.getHtml(function (err, html) {
                        if (err) {
                            return callback(err, null);
                        }
                        htmlBuffer = insertIntoHtmlStr('flexo-child-view', key, html, htmlBuffer);
                        viewsLoaded++;
                        if (viewsLoaded === viewCount) {
                            callback(null, htmlBuffer);
                        }
                    });
                });
            });
        });
    },

    getChildViews: function (callback) {
        callback(null, _.result(this, 'childViews'));
    },

    addChild: function (viewName, $target, callback) {
        var self = this;
        this.loadChildView(viewName, function (err, View) {
            if (err) {
                return callback(err, null);
            }
            self.getChildViewOptions(function (err, options) {
                if (err) {
                    return callback(err, null);
                }
                self._childViews[viewName] = new View(options);
                view.render(function (err, html) {
                    if (err) {
                        return callback(err, null);
                    }
                    self.appendChildView($target, view, callback);
                });
            });
        });
    },

    loadChildView: function (viewName, callback) {
        callback(null, Backbone.View);
    },

    resolveChildView: function (viewName, callback) {
        var view = this._childViews[viewName];
        var View;
        var self = this;
        if (view) {
            return callback(null, view);
        }

        if (!(View = this.childViews[viewName])) {
            return callback(new Error('Child view, ' + viewName + ' could not be resolved.'), null);
        }
        this.getChildViewOptions(function (err, options) {
            if (err) {
                return callback(err, null);
            }
            view = self._childViews[viewName] = new View(options);
            callback(null, view);
        });
    },

    appendChildView: function ($target, view, callback) {
        $target.append(view.$el);
        callback(null, view);
        this.trigger('flexo:childView:added', view);
    },

    getChildViewOptions: function (callback) {
        callback(null, _.clone(_.result(this, 'childViewOptions')));
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

        return _.extend(attrs, this.getAttributes());
    },

    getAttributes: function () {
        return {
            'flexo-view': this.cid
        };
    }

});