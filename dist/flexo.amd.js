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
    
    function noop() {}
    function defaultCallback() {}
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
    flexo.View = View;

    var CollectionView = View.extend({
    
        _collections: [],
    
        _itemViews: {},
    
        constructor: function (options) {
            View.call(this, options);
            this.collections || (this.collections = {});
            this.collection || (this.collection = {});
            this.itemViewOptions || (this.itemViewOptions = {});
            return this;
        },
    
        getInnerHtml: function (callback) {
            var self = this;
            callback = callback || defaultCallback;
    
            View.prototype.getInnerHtml.call(this, function (innerHtml) {
                self._getCollectionHtml(innerHtml, function (collectionInnerHtml) {
                    callback(collectionInnerHtml);
                });
            });
        },
    
        getCollection: function (nameCollection, callback) {
            if (_.isString(nameCollection)) {
                this.resolveCollection(nameCollection, callback);
            } else if (nameCollection instanceof Backbone.Collection) {
                callback(nameCollection);
            } else {
                callback(new Backbone.Collection());
            }
        },
    
        resolveCollection: function (name, callback) {
            try {
                var collection = this.collections[name];
                callback(collection);
            } catch (e) {
                callback(new Backbone.Collection());
            }
        },
    
        getItemView: function (model, collection, callback) { // TODO: throw error if view not found
            try {
                var View = this.itemViews[this._findCollection(collection).name];
            } catch (e) {
                var View = flexo.View.extend({
                    template: ''
                });
            } finally {
                callback(View);
            }
        },
    
        getEmptyView: function (collection, callback) {
            try {
                var View = this.emptyViews[this._findCollection(collection).name];
            } catch (e) {
                var View = flexo.View.extend({
                    template: ''
                });
            } finally {
                callback(View);
            }
        },
    
        addItemView: function ($target, view, callback) {
            $target.append(view.$el);
            callback();
        },
    
        addEmptyView: function ($target, view, callback) {
            $target.append(view.$el);
            callback();
        },
    
        removeEmptyView: function ($target, view, callback) {
            view.remove();
            callback();
        },
    
        removeItemView: function ($target, view, callback) {
            view.remove();
            callback();
        },
    
        renderCollection: function (collection, callback) {
            var collections = !_.isFunction(collection) ? [this._findCollection(collection)] : this._collections;
            var length = collections.length;
            var $target;
            var itemViewsToBeAdded = _.reduce(collections, function (memo, collection) { return memo + collection.length; }, 0);
            var itemViewsAdded = 0;
            var self = this;
    
            callback = _.isFunction(collection) ? collection : callback;
            callback = callback || defaultCallback;
    
            function isDone() {
                itemViewsAdded++;
                if (itemViewsToBeAdded === itemViewsAdded) {
                    callback(); // TODO: trigger collection render
                }
            }
    
            for (var i = 0; i < length; i++) {
                (function (i) {
                    $target = this.$('[flexo-collection="' + collections[i].name + '"]');
                    if (collections[i].length) {
                        collections[i].each(function (model) {
                            self.this._addItemView(model, collections[i], isDone);
                        });
                    } else { // empty view
                        this._getEmptyItemViewInstance(null, collection, function (emptyView) {
                            if (emptyView) {
                                emptyView.render(function () {
                                    self.addEmptyView($target, view, function () { // TODO: trigger add empty view
                                        callback(); // TODO: trigger collection render
                                    });
                                });
                            } else {
                                callback(); // TODO: trigger collection render
                            }
                        });
                    }
                })(i);
            }
        },
    
        attach: function () {
            flexo.View.prototype.call(this);
            this.attachItemViews();
        },
    
        attachItemViews: function () {
            for (var k in this._itemViews) {
                this._itemViews[k].attach();
            }
        },
    
        _listenToCollection: function (collection) {
            this.listenTo(collection, 'add', this._collectionAdd, this);
            this.listenTo(collection, 'remove', this._collectionRemove, this);
            this.listenTo(collection, 'reset', this._collectionReset, this);
        },
    
        _addItemView: function (model, collectionDef, callback) {
            var $target = this.$('[flexo-collection="' + collectionDef.name + '"]');
            var self = this;
    
            function addItemView($target, model, collection) {
                self._getEmptyItemViewInstance(model, collection, function (itemView) {
                    itemView.render(function () {
                        self.addItemView($target, itemView, function () {
                            callback(); // TODO: trigger add event
                        });
                    });
                });
            }
    
            if (collectionDef.emptyViewShown) {
                self.removeEmptyView($target, collectionDef.emptyView, function () {
                    addItemView($target, model, collectionDef.collection);
                });
            } else {
                addItemView($target, model, collectionDef.collection);
            }
        },
    
        _collectionAdd: function (model, collection) {
            var collectionDef = this._findCollection(collection);
            this._addItemView(model, collectionDef, function () {});
        },
    
        _collectionRemove: function (model, collection) { // TODO: check if there are no more items in the collection
            var collectionDef = this._findCollection(collection);
            var $target = this.$('[flexo-collection="' + collectionDef.name + '"]');
            var view = this._itemViews[model.cid];
            var self = this;
    
            this.removeItemView($target, view, function () { // TODO: trigger remove event
                if (!collection.length) {
                    this._getEmptyItemViewInstance(null, collection, function (emptyView) {
                        if (emptyView) {
                            self.addEmptyView($target, emptyView, function () { // TODO: trigger empty view add event
    
                            });
                        }
                    });
                }
            });
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
    
        _getCollectionHtml: function (html, callback) {
            var self = this;
            var collectionNames = this._findCollectionNames(html);
            var collectionHtml = {};
            var collectionsCount = 0;
            var collectionsHtmlResolved = 0;
            callback = callback || defaultCallback;
    
            function isDone() {
                collectionsHtmlResolved++;
                if (collectionsCount === collectionsHtmlResolved) {
                    callback(self._insertCollectionHtml(collectionNames, collectionHtml, html));
                }
            }
    
            if (collectionNames.length) { // collection targets defined in html; get html for each collection
                collectionsCount = collectionNames.length;
                for (var i = 0; i < collectionNames.length; i++) {
                    (function (i) {
                        self.getCollection(collectionNames[i], function (collection) {
                            self._addCollection(collectionNames[i], collection);
                            self._getItemViewsHtml(collection, function (itemViewsHtml) {
                                collectionHtml[collectionNames[i]] = itemViewsHtml;
                                isDone();
                            });
                        });
                    })(i);
                }
            } else if (this.collection) { // collection is inserted directly under this.el
                self.getCollection(this.collection, function (collection) {
                    self._getItemViewsHtml(collection, function (itemViewsHtml) {
                        callback(itemViewsHtml);
                    });
                });
            } else { // no collection found or defined
                return html;
            }
        },
    
        _insertCollectionHtml: function (collectionNames, collectionHtml, html) {
            var match,
                htmlOpen,
                htmlClose,
                self = this;
    
            for (var i = 0; i < collectionNames.length; i ++) {
                match = getInsertIndex('flexo-collection', collectionNames[i], html);
                htmlOpen = html.substr(0, match.index + match[0].length);
                htmlClose = html.substr(match.index + match[0].length);
                html = htmlOpen + collectionHtml[collectionNames[i]] + htmlClose;
            }
    
            return html;
        },
    
        _getItemViewsHtml: function (collection, callback) {
            var html = '';
            var self = this;
            var view;
            var itemViewsCreated = 0;
    
            function isDone() {
                itemViewsCreated++;
                if (collection.length === itemViewsCreated) {
                    callback(html);
                }
            }
    
            if (!collection.length) {
                this._getEmptyItemViewInstance(null, collection, function (emptyView) {
                    self._setEmptyViewStatus(collection, true);
                    if (emptyView) {
                        emptyView.getHtml(function (html) {
                            callback(html);
                        });
                    } else {
                        callback(html);
                    }
                });
            } else {
                self._setEmptyViewStatus(collection, false);
                collection.each(function (model) {
                    self._getEmptyItemViewInstance(model, collection, function (itemView) {
                        itemView.getHtml(function (itemViewHtml) {
                            html += itemViewHtml;
                            isDone();
                        });
                    });
                });
            }
        },
    
        _getItemViewOptions: function (options) {
            options || (options = {});
            return _.extend(options, this.itemViewOptions);
        },
    
        _getEmptyItemViewInstance: function (model, collection, callback) {
            var self = this;
            var view;
            var collectionDef = this._findCollection(collection);
    
            if (model) {
                if (self._itemViews[model.cid]) {
                    return callback(self._itemViews[model.cid]);
                }
    
                this.getItemView(model, collection, function (ItemView) {
                    view = new ItemView(self._getItemViewOptions({ model: model }));
                    self._itemViews[model.cid] = view;
                    callback(view);
                });
            } else {
                if (collectionDef && collectionDef.emptyView) {
                    return callback(collectionDef.emptyView);
                }
    
                this.getEmptyView(collection, function (EmptyView) {
                    view = new EmptyView(self._getItemViewOptions());
                    collectionDef.emptyView = view;
                    callback(view);
                });
            }
        },
    
        _setEmptyViewStatus: function (collection, status) {
            this._findCollection(collection).emptyViewShown = status;
        },
    
        _findCollectionNames: function (html) {
            var htmlSubstr = html,
                match = true,
                names = [],
                start = 0;
    
            // TODO: there has to better way than looping and creating substrings
            // someone please help me; i suck at regexes
            while (match) {
                htmlSubstr = htmlSubstr.substr(start);
                match = htmlSubstr.match(/<[^>]*\s(?:flexo-collection=["']([^"']*)["'])[^>]*>/);
                if (match) {
                    names.push(match[1]);
                    start = match[0].length + match.index;
                }
            }
    
            return names;
        }
    
    });
    flexo.CollectionView = CollectionView;

    return flexo;

});