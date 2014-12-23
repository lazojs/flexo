// Flexo, Nah, I'm just messin' with ya; you're all right.
// ----------------------------------
// v0.0.1
//
// Copyright (c)2014 Jason Strimpel
// Distributed under MIT license
define(['underscore', 'backbone'], function (_, Backbone) {

    'use strict';

    var flexo = {
        isClient: false,
        isServer: false
    };
    
    function getDefaultOptions() {
        var defaultOptions = {
            success: function () {},
            error: function (err) {
                throw err;
            }
        };
    }
    
    function getErrorOption(options) {
        return { error: options.error || function (err) {
            throw err;
        }};
    }
    
    function setOptions(options) {
        var defaultOptions = {
            success: function () {},
            error: function (err) {
                throw err;
            }
        };
    
        return _.defaults(options, defaultOptions);
    }
    
    function noop() {}
    function getInsertIndex(attr, val, html) {
        var regex = new RegExp('<[^<]*' + attr + '+=["||\']' + val + '["||\']+.*?>');
        return html.match(regex);
    }
    function insertIntoHtmlStr(attr, val, html, htmlBuffer) {
        var match = getInsertIndex(attr, val, htmlBuffer);
        var htmlBufferOpen = htmlBuffer.substr(0, match.index + match[0].length);
        var htmlBufferClose = htmlBuffer.substr(match.index + match[0].length);
    
        htmlBuffer = htmlBufferOpen + html + htmlBufferClose;
        return htmlBuffer;
    }
    
    try {
        window;
        flexo.isClient = true;
    } catch (e) {
        flexo.isServer = true;
    }
    
    if (flexo.isServer) {
        Backbone.View.prototype._ensureElement = noop;
        Backbone.View.prototype.delegateEvents = noop;
        Backbone.View.prototype.undelegateEvents = noop;
    }

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
    flexo.View = View;

    var CollectionView = View.extend({
    
        constructor: function (options) {
            View.call(this, options);
            this.collections || (this.collections = []);
            this._collections || (this._collections = []);
            this.collection || (this.collection = {});
            this._itemViews || (this._itemViews = {});
            this._emptyViews || (this._emptyViews = {});
            this.itemViewOptions || (this.itemViewOptions = {});
        },
    
        getInnerHtml: function (options) {
            var self = this;
            options = setOptions(options);
    
            View.prototype.getInnerHtml.call(this, _.extend(getErrorOption(options), {
                success: function (innerHtml) {
                    self._getCollectionHtml(innerHtml, _.extend(getErrorOption(options), {
                        success: function (collectionInnerHtml) {
                            options.success(collectionInnerHtml);
                        }
                    }));
                }
            }));
        },
    
        getCollection: function (nameCollection, options) {
            options = setOptions(options);
    
            if (_.isString(nameCollection)) {
                this.resolveCollection(nameCollection, options);
            } else if (nameCollection instanceof Backbone.Collection) {
                options.success(nameCollection);
            } else {
                options.success(new Backbone.Collection());
            }
        },
    
        resolveCollection: function (name, options) {
            options = setOptions(options);
    
            try {
                var collection = this.collections[name];
                options.success(collection);
            } catch (e) {
                options.error(e);
            }
        },
    
        getItemView: function (model, collection, options) {
            options = setOptions(options);
            try {
                var View = this.itemViews[this._findCollection(collection).name];
                options.success(View);
            } catch (e) {
                options.error(e);
            }
        },
    
        getEmptyView: function (collection, options) {
            options = setOptions(options);
            try {
                var View = this.emptyViews[this._findCollection(collection).name];
                options.success(View);
            } catch (e) {
                options.error(e);
            }
        },
    
        addItemView: function ($target, view, options) {
            options = setOptions(options);
            $target.append(view.$el);
            options.success(view);
            this.trigger(this.eventNameSpace + ':itemView:added', view);
        },
    
        addEmptyView: function ($target, view, options) {
            options = setOptions(options);
            $target.append(view.$el);
            options.success(view);
            this.trigger(this.eventNameSpace + ':emptyView:added', view);
        },
    
        removeEmptyView: function ($target, view, options) {
            options = setOptions(options);
            view.remove();
            options.success(true);
            this.trigger(this.eventNameSpace + ':itemView:removed');
        },
    
        removeItemView: function ($target, view, options) {
            options = setOptions(options);
            view.remove();
            options.success(true);
            this.trigger(this.eventNameSpace + ':emptyView:removed');
        },
    
        renderCollection: function (collection, options) {
            var collections = !_.isFunction(collection) ? [this._findCollection(collection)] : this._collections;
            var length = collections.length;
            var $target;
            var itemViewsToBeAdded = _.reduce(collections, function (memo, collection) { return memo + collection.length; }, 0);
            var itemViewsAdded = 0;
            var self = this;
    
            options = collection instanceof Backbone.Collection ? collection : options;
            options = setOptions(options);
    
            for (var i = 0; i < length; i++) {
                (function (i) {
                    $target = this.$('[' + self.attributeNameSpace + '-collection-target="' + collections[i].name + '"]');
                    if (collections[i].length) {
                        collections[i].each(function (model) {
                            self.this._addItemView(model, collections[i], _.extend(getErrorOption(options), {
                                success: function () {
                                    itemViewsAdded++;
                                    if (itemViewsToBeAdded === itemViewsAdded) {
                                        options.success(true);
                                        self.trigger(self.eventNameSpace + ':collection:rendered', collections[i]);
                                    }
                                }
                            }));
                        });
                    } else { // empty view
                        this._getEmptyItemViewInstance(null, collections[i], _.extend(getErrorOption(options), {
                            success: function () {
                                if (emptyView) {
                                    emptyView.render(_.extend(getErrorOption(options), {
                                        success: function (result) {
                                            options.success(result);
                                            self.trigger(self.eventNameSpace + ':collection:rendered', collections[i]);
                                        }
                                    }));
                                } else {
                                    options.success(true);
                                    self.trigger(self.eventNameSpace + ':collection:rendered', collections[i]);
                                }
                            }
                        }));
                    }
                })(i);
            }
        },
    
        attach: function (el, options) {
            var loaded = 0;
            options = setOptions(options);
    
            function onSuccess() {
                loaded++;
                if (loaded === 2) {
                    options.success(true);
                }
            }
    
            flexo.View.prototype.attach.call(this, el, {
                error: options.error,
                success: onSuccess
            });
            this.attachItemViews({
                error: options.error,
                success: onSuccess
            });
        },
    
        attachItemViews: function (options) {
            var expected = _.size(this._itemViews);
            var loaded = 0;
            options = setOptions(options);
    
            if (!expected) {
                options.success(true);
            }
    
            for (var k in this._itemViews) {
                this._itemViews[k].attach(this.$('[' + this.attributeNameSpace + '-model-id="' + this._itemViews[k].cid + '"]'), {
                    error: options.error,
                    success: function () {
                        loaded++;
                        if (loaded === expected) {
                            options.success(true);
                        }
                    }
                });
            }
            options.success(true);
            this.trigger(this.eventNameSpace + ':itemViews:attached');
        },
    
        getItemViewOptions: function (type, model, collection, options) {
            return this._getItemViewOptions(options);
        },
    
        createItemView: function (View, model, collection) {
            var view = new View(this.getItemViewOptions('itemView', model, collection, { model: model }));
            this._itemViews[model.cid] = view;
            return view;
        },
    
        createEmptyView: function (View, collection) {
            var view = new View(thid.getItemViewOptions('emptyView', null, collection, {}));
            this._emptyViews[collection.cid] = view;
            return view;
        },
    
        _collections: null,
    
        _itemViews: null,
    
        _emptyViews: null,
    
        _listenToCollection: function (collection) {
            this.listenTo(collection, 'add', this._collectionAdd, this);
            this.listenTo(collection, 'remove', this._collectionRemove, this);
            this.listenTo(collection, 'reset', this._collectionReset, this);
        },
    
        _addItemView: function (model, collectionDef, options) {
            var $target = this.$('[' + this.attributeNameSpace + '-collection-target="' + collectionDef.name + '"]');
            var self = this;
            options = setOptions(options);
    
            function addItemView($target, model, collection) {
                self._getEmptyItemViewInstance(model, collection, _.extend(getErrorOption(options), {
                    success: function (itemView) {
                        itemView.render(_.extend(getErrorOption(options), {
                            success: function (html) {
                                self.addItemView($target, itemView, _.extend(getErrorOption(options), {
                                    success: function (result) {
                                        options.success(result);
                                        self.trigger(self.eventNameSpace + ':itemView:added', itemView);
                                    }
                                }));
                            }
                        }));
                    }
                }));
            }
    
            if (this._emptyViews[collectionDef.cid] && this._emptyViews[collectionDef.cid].emptyViewShown) {
                this.removeEmptyView($target, this._emptyViews[collectionDef.collection.cid], _.extend(getErrorOption(options), {
                    success: function (result) {
                        addItemView($target, model, collectionDef.collection);
                    }
                }));
            } else {
                addItemView($target, model, collectionDef.collection);
            }
        },
    
        _collectionAdd: function (model, collection) {
            var collectionDef = this._findCollection(collection);
            this._addItemView(model, collectionDef, function (err, result) {
                if (err) {
                    throw err;
                }
            });
        },
    
        _collectionRemove: function (model, collection) { // TODO: check if there are no more items in the collection
            var collectionDef = this._findCollection(collection);
            var $target = this.$('[' + this.attributeNameSpace + '-collection-target="' + collectionDef.name + '"]');
            var view = this._itemViews[model.cid];
            var self = this;
            var options = setOptions({});
    
            this.removeItemView($target, view, _.extend(getErrorOption(options), {
                success: function (result) {
                    if (!collection.length) {
                        this._getEmptyItemViewInstance(null, collection, _.extend(getErrorOption(options), {
                            success: function (emptyView) {
                                if (emptyView) {
                                    self.addEmptyView($target, emptyView, _.extend(getErrorOption(options), {
                                        success: function (result) {
                                            options.success(result);
                                            self.trigger(self.eventNameSpace + ':emptyView:removed', collection);
                                        }
                                    }));
                                }
                            }
                        }));
                    }
                }
            }));
        },
    
        _collectionReset: function (collection) {
            this.renderCollection(collection);
        },
    
        _addCollection: function (name, collection) {
            if (!this._findCollection(collection)) {
                this._listenToCollection(collection);
                this._collections.push({ name: name, collection: collection });
            }
        },
    
        _findCollection: function (collection) {
            var i = this._collections.length;
    
            while (i) {
                i--;
                if (this._collections[i].collection === collection) {
                    return this._collections[i];
                }
            }
    
            return null;
        },
    
        _getCollectionHtml: function (html, options) {
            var self = this;
            var collectionNames = this._findCollectionNames(html);
            var collectionHtml = {};
            var collectionsCount = 0;
            var collectionsHtmlResolved = 0;
            options = setOptions(options);
    
            function isDone() {
                collectionsHtmlResolved++;
                if (collectionsCount === collectionsHtmlResolved) {
                    options.success(self._insertCollectionHtml(collectionNames, collectionHtml, html));
                }
            }
    
            if (collectionNames.length) { // collection targets defined in html; get html for each collection
                collectionsCount = collectionNames.length;
                for (var i = 0; i < collectionNames.length; i++) {
                    (function (i) {
                        self.getCollection(collectionNames[i], _.extend(getErrorOption(options), {
                            success: function (collection) {
                                self._addCollection(collectionNames[i], collection);
                                self._getItemViewsHtml(collection, _.extend(getErrorOption(options), {
                                    success: function (itemViewsHtml) {
                                        collectionHtml[collectionNames[i]] = itemViewsHtml;
                                        isDone();
                                    }
                                }));
                            }
                        }));
                    })(i);
                }
            } else if (this.collection) { // collection is inserted directly under this.el
                self.getCollection(this.collection, _.extend(getErrorOption(options), {
                    success: function (collection) {
                        self._getItemViewsHtml(collection, _.extend(getErrorOption(options), {
                            success: function (itemViewsHtml) {
                                options.success(itemViewsHtml);
                            }
                        }));
                    }
                }));
            } else { // no collection found or defined
                return options.success(html);
            }
        },
    
        _insertCollectionHtml: function (collectionNames, collectionHtml, html) {
            var match;
            var htmlOpen;
            var htmlClose;
            var self = this;
    
            for (var i = 0; i < collectionNames.length; i ++) {
                match = getInsertIndex(this.attributeNameSpace + '-collection-target', collectionNames[i], html);
                htmlOpen = html.substr(0, match.index + match[0].length);
                htmlClose = html.substr(match.index + match[0].length);
                html = htmlOpen + collectionHtml[collectionNames[i]] + htmlClose;
            }
    
            return html;
        },
    
        _getItemViewsHtml: function (collection, options) {
            var html = '';
            var self = this;
            var view;
            var itemViewsCreated = 0;
            options = setOptions(options);
    
            function isDone() {
                itemViewsCreated++;
                if (collection.length === itemViewsCreated) {
                    options.success(html);
                }
            }
    
            if (!collection.length) {
                this._getEmptyItemViewInstance(null, collection, _.extend(getErrorOption(options), {
                    success: function (emptyView) {
                        self._setEmptyViewStatus(collection, true);
                        if (emptyView) {
                            emptyView.getHtml(_.extend(getErrorOption(options), {
                                success: function (html) {
                                    options.success(html);
                                }
                            }));
                        } else {
                            options.success(html);
                        }
                    }
                }));
            } else {
                self._setEmptyViewStatus(collection, false);
                collection.each(function (model) {
                    self._getEmptyItemViewInstance(model, collection, _.extend(getErrorOption(options), {
                        success: function (itemView) {
                            itemView.getHtml(_.extend(getErrorOption(options), {
                                success: function (itemViewHtml) {
                                    html += itemViewHtml;
                                    isDone();
                                }
                            }));
                        }
                    }));
                });
            }
        },
    
        _getItemViewOptions: function (options) {
            options || (options = {});
            return _.extend({}, options, _.result(this, 'itemViewOptions'));
        },
    
        _getEmptyItemViewInstance: function (model, collection, options) {
            var self = this;
            var view;
            var collectionDef = this._findCollection(collection);
            options = setOptions(options);
    
            if (model) {
                if (this._itemViews[model.cid]) {
                    return options.success(self._itemViews[model.cid]);
                }
    
                this.getItemView(model, collection, _.extend(getErrorOption(options), {
                    success: function (ItemView) {
                        options.success(self.createItemView(ItemView, model, collection));
                    }
                }));
            } else {
                if (this._emptyViews[collectionDef.colleciton.cid]) {
                    return options.success(this._emptyViews[collectionDef.colleciton.cid]);
                }
    
                this.getEmptyView(collection, _.extend(getErrorOption(options), {
                    success: function (EmptyView) {
                        options.success(self.createEmptyView(EmptyView, collection));
                    }
                }));
            }
        },
    
        _setEmptyViewStatus: function (collection, status) {
            if (_.isNull(this._findCollection(collection))) {
                throw new Error('Could not find collection target in markup.');
            }
    
            if (this._emptyViews[collection.cid]){
                this._emptyViews[collection.cid].emptyViewShown = status;
            }
        },
    
        _findCollectionNames: function (html) {
            var htmlSubstr = html;
            var match = true;
            var names = [];
            var start = 0;
            var regex = new RegExp('<[^>]*\\s(?:' + this.attributeNameSpace + '-collection-target=["\']([^"\']*)["\'])[^>]*>');
    
            // TODO: there has to better way than looping and creating substrings
            // someone please help me; i suck at regexes
            while (match) {
                htmlSubstr = htmlSubstr.substr(start);
                match = htmlSubstr.match(regex);
                if (match) {
                    names.push(match[1]);
                    start = match[0].length + match.index;
                }
            }
    
            return names;
        },
    
        _onRemove: function () {
            View.prototype._onRemove.call(this);
            for (var k in this._itemViews) {
                this._itemViews[k].remove();
                delete this._itemViews[k];
            }
    
            for (var j in this._emptyViews) {
                this._emptyViews[j].remove();
                delete this._emptyViews[j];
            }
    
            return this;
        }
    
    });
    flexo.CollectionView = CollectionView;

    return flexo;

});