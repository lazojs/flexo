var View = Backbone.View.extend({

    childViewOptions: {},

    attributeNameSpace: 'flexo',

    eventNameSpace: 'flexo',

    constructor: function (options) {
        this.cid = _.uniqueId('view');
        this.augment(options || (options = {}));
        this.isServer = flexo.isServer;
        this.isClient = flexo.isClient;
        this._ensureElement();
        this.initialize.apply(this, arguments);
        this.delegateEvents();
    },

    render: function (options) {
        var self = this;
        options = setOptions(options);
        if (this.isServer) {
            return options.success(null, '');
        }

        this.getInnerHtml(_.extend(getErrorOption(options), {
            success: function (html) {
                self.$el.html(html);
                self.afterRender();
                options.success(html);
                self.trigger('flexo:rendered', self);
            }
        }));
    },

    augment: function (options) {
        _.extend(this, options);
    },

    attach: function (el, options) {
        options = setOptions(options);
        this.setElement(el);
        this.onAttach();
        this.trigger(this.eventNameSpace + ':attached', this);
        this.attachChildViews(options);
    },

    attachChildViews: function (options) {
        options = setOptions(options);
        if (!_.size(this._childViews)) {
            return options.success(true);
        }

        for (var k in this._childViews) {
            this._childViews[k].attach(this.$('[' + this.attributeNameSpace + '-view-id="' + this._childViews[k].cid + '"]'), {
                error: options.error,
                success: options.success
            });
        }
    },

    afterRender: function () {},

    onRemove: function () {},

    onAttach: function () {},

    getAttributes: function () {
        var retVal = {};
        retVal[this.attributeNameSpace + '-view'] = this.cid;
        return retVal;
    },

    remove: function () {
        this._onRemove();
        this.onRemove();
        Backbone.View.prototype.remove.call(this);
        this.trigger(this.eventNameSpace + ':removed');
        return this;
    },

    getHtml: function (options) {
        var self = this;
        options = setOptions(options);
        this.getInnerHtml(_.extend(getErrorOption(options), {
            success: function (innerHtml) {
                options.success(self._wrapperEl(innerHtml));
            }
        }));
    },

    getInnerHtml: function (options) {
        var self = this;
        options = setOptions(options);
        this.getRenderer(_.extend(getErrorOption(options), {
            success: function (renderer) {
                self.serializeData(_.extend(getErrorOption(options), {
                    success: function (data) {
                        renderer(data, _.extend(getErrorOption(options), {
                            success: function (html) {
                                self.getChildViewsHtml(html, options);
                            }
                        }));
                    }
                }));
            }
        }));
    },

    getRenderer: function (options) {
        options = setOptions(options);
        if (this.renderer) {
            return options.success(this.renderer);
        }

        var self = this;
        this.getTemplateEngine(_.extend(getErrorOption(options), {
            success: function (engine) {
                var compiledTemplate = engine(self.template);
                self.renderer = function (context, options) {
                    var renderedTemplate = compiledTemplate(context);
                    try {
                        renderedTemplate = compiledTemplate(context);
                        options.success(compiledTemplate(context));
                    } catch (err) {
                        options.error(err);
                    }
                };
                options.success(self.renderer);
            }
        }));
    },

    getTemplateEngine: function (options) {
        options = setOptions(options);
        options.success(_.template);
    },

    serializeData: function (options) {
        var data = this.model ? this.model.toJSON() : {};
        options = setOptions(options);
        this.transformData(data, options);
    },

    transformData: function (data, options) {
        options = setOptions(options);
        options.success(data);
    },

    setElement: function () { // set view el attributes after bb.prototype.setElement is called
        var response = Backbone.View.prototype.setElement.apply(this, arguments);
        this._setElAttributes(_.extend(this._getAttributes(), this.getAttributes()));
        return response;
    },

    getChildViewsHtml: function (htmlBuffer, options) {
        var self = this;
        options = setOptions(options);

        this.getChildViews(_.extend(getErrorOption(options), {
            success: function (views) {
                var viewCount = views ? _.size(views) : 0;
                var viewsLoaded = 0;
                if (!viewCount) {
                    return options.success(htmlBuffer);
                }

                _.each(views, function (view, key) {
                    self.resolveChildView(key, _.extend(getErrorOption(options), {
                        success: function (view) {
                            view.getHtml(_.extend(getErrorOption(options), {
                                success: function (html) {
                                    htmlBuffer = insertIntoHtmlStr(self.attributeNameSpace + '-child-view', key, html, htmlBuffer);
                                    viewsLoaded++;
                                    if (viewsLoaded === viewCount) {
                                        options.success(htmlBuffer);
                                    }
                                }
                            }));
                        }
                    }));
                });
            }
        }));
    },

    getChildViews: function (options) {
        options = setOptions(options);
        options.success(_.result(this, 'childViews'));
    },

    addChild: function (viewName, $target, options) {
        var self = this;
        options = setOptions(options);

        this.loadChildView(viewName, _.extend(getErrorOption(options), {
            success: function (View) {
                var view = self._childViews[viewName] = new View(self.getChildViewOptions());
                self.appendChildView($target, view, options);
            }
        }));
    },

    loadChildView: function (viewName, options) {
        options = setOptions(options);
        options.success(Backbone.View);
    },

    resolveChildView: function (viewName, options) {
        var view = this._childViews[viewName];
        var View;
        options = setOptions(options);

        if (view) {
            return options.success(view);
        }

        if (!(View = this.childViews[viewName])) {
            return options.error(new Error('Child view, ' + viewName + ' could not be resolved.'));
        }

        view = this._childViews[viewName] = new View(this.getChildViewOptions());
        options.success(view);
    },

    appendChildView: function ($target, view, options) {
        options = setOptions(options);
        $target.append(view.$el);
        options.success(view);
        this.trigger(this.eventNameSpace + ':childView:added', view);
    },

    getChildViewOptions: function (options) {
        return _.extend({}, options, this._getChildViewOptions());
    },

    _childViews: {},

    _getChildViewOptions: function () {
        return _.clone(_.result(this, 'childViewOptions'));
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

    _onRemove: function () {
        for (var k in this._childViews) {
            this._childViews[k].remove();
            delete this._childViews[k];
        }

        return this;
    }

});