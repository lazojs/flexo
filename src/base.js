var View = Backbone.View.extend({

    childOptions: {},

    attributeNameSpace: 'flexo',

    eventNameSpace: 'flexo',

    constructor: function (options) {
        this.cid = _.uniqueId('view');
        this.children = _.size(this.children) ? _.clone(this.children) : {};
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
                self.trigger(self.eventNameSpace + ':rendered', self);
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
        var expected = _.size(this.children);
        var attached = 0;
        options = setOptions(options);
        if (!expected) {
            return options.success(true);
        }

        for (var k in this.children) {
            this.children[k].attach(this.$('[' + this.attributeNameSpace + '-view-id="' + this.children[k].cid + '"]')[0], {
                error: options.error,
                success: function () {
                    attached++;
                    if (attached === expected) {
                        options.success(true);
                    }
                }
            });
        }
    },

    afterRender: function () {},

    onRemove: function () {},

    onAttach: function () {},

    getAttributes: function () {
        var retVal = {};
        retVal[this.attributeNameSpace + '-view-id'] = this.cid;
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
                                self._getChildrenHtml(html, options);
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

    getChildren: function (options) {
        options = setOptions(options);
        options.success(_.result(this, 'children'));
    },

    addChild: function (viewName, $target, options) {
        var self = this;
        options = setOptions(options);

        this.loadChild(viewName, _.extend(getErrorOption(options), {
            success: function (View) {
                var view = self.children[viewName] = new View(self.getChildOptions());
                self.appendChild($target, view, options);
            }
        }));
    },

    loadChild: function (viewName, options) {
        options = setOptions(options);
        options.success(View);
    },

    resolveChild: function (viewName, options) {
        var view = this.children[viewName];
        var View;
        options = setOptions(options);

        if (view.cid) {
            return options.success(view);
        }

        if (!(View = this.children[viewName])) {
            return options.error(new Error('Child view, ' + viewName + ' could not be resolved.'));
        }

        view = this.children[viewName] = new View(this.getChildOptions());
        options.success(view);
    },

    appendChild: function ($target, view, options) {
        options = setOptions(options);
        $target.append(view.$el);
        options.success(view);
        this.trigger(this.eventNameSpace + ':child:added', view);
    },

    getChildOptions: function (options) {
        return _.extend({}, options, this._getChildOptions());
    },

    _getChildrenHtml: function (htmlBuffer, options) {
        var self = this;
        options = setOptions(options);

        this.getChildren(_.extend(getErrorOption(options), {
            success: function (views) {
                var viewCount = views ? _.size(views) : 0;
                var viewsLoaded = 0;
                if (!viewCount) {
                    return options.success(htmlBuffer);
                }

                _.each(views, function (view, key) {
                    self.resolveChild(key, _.extend(getErrorOption(options), {
                        success: function (view) {
                            view.getHtml(_.extend(getErrorOption(options), {
                                success: function (html) {
                                    htmlBuffer = insertIntoHtmlStr(self.attributeNameSpace + '-view', key, html, htmlBuffer);
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

    _getChildOptions: function (options) {
        options || (options = {});
        return _.extend({}, options, _.result(this, 'childOptions'));
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
        for (var k in this.children) {
            this.children[k].remove();
            delete this.children[k];
        }

        return this;
    }

});