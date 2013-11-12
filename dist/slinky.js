var slinky = (function (global, Backbone, _) {

    'use strict';

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

    var View = Backbone.View.extend({
    
        constructor: function (options) {
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
    slinky.View = View;

    var CollectionView = View.extend({
    
        _isEmptyViewShown: [],
    
        _itemViews: {},
    
        _emptyViews: {},
    
        constructor: function (options) {
            options || (options = {});
            this.collections = this.collections || options.collections;
            this.collection = this.collection || options.collection;
            View.call(this, options);
            this.itemViewOptions = options.itemViewOptions || this.itemViewOptions;
            this.itemViewOptions = this.itemViewOptions || {};
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
                callback(this.collections[name]);
            } catch (e) {
                callback(new Backbone.Collection());
            }
        },
    
        getItemView: function (model, callback) {
            var View = slinky.View.extend({
                template: ''
            });
            callback(new View({}));
        },
    
        getEmptyView: function (collection, callback) {
            var View = slinky.View.extend({
                template: ''
            });
            callback(new View({}));
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
                match = getInsertIndex('slinky-collection', collectionNames[i], html);
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
                this._getEmptyViewInstance(collection, function (emptyView) {
                    self._setEmptyViewStatus(null, collection, true);
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
                    self._getEmptyViewInstance(model, collection).getHtml(function (itemViewHtml) {
                        html += itemViewHtml;
                    });
                });
            }
        },
    
        _getEmptyViewInstance: function (model, collection, callback) {
            if (model) {
                this.getItemView(model, collection, callback);
            } else {
                this.getEmptyView(collection, callback);
            }
        },
    
        _setEmptyViewStatus: function (collection, status) {
            var i = this._isEmptyViewShown.length;
            var self = this;
    
            function push(collection, status) {
                self._isEmptyViewShown.push({ collection: collection, status: status });
            }
    
            if (!i) {
                push(collection, status);
            } else {
                while (i) {
                    i--;
                    if (this._isEmptyViewShown[i].collection === collection) {
                        this._isEmptyViewShown[i].status = status;
                        return this;
                    }
                }
    
                push(collection, status);
            }
    
            return this;
        },
    
        _findCollectionNames: function (html) { // TODO: get some regex help from the community
            var htmlSubstr = html,
                match = true,
                names = [],
                start = 0;
    
            while (match) {
                htmlSubstr = htmlSubstr.substr(start);
                match = htmlSubstr.match(/<[^>]*\s(?:slinky-collection=["']([^"']*)["'])[^>]*>/);
                if (match) {
                    names.push(match[1]);
                    start = match[0].length + match.index;
                }
            }
    
            return names;
        }
    
    });
    
    
    // define(['lazoView', 'renderer', 'underscore'], function (View, renderer, _) {
    
    //     'use strict';
    
    //     var COLLECTION_SPECIFIER = 'collection'; // value for lazo-collection-target when collection object is specified
    
    //     var LazoCollectionView = View.extend({
    
    //         constructor: function (options) {
    //             var collection;
    //             options = options || {};
    //             this._augmentKeys = View.prototype._augmentKeys.concat(['itemView', 'emptyView']);
    //             if (_.isString((collection = options.collection || this.collection))) {
    //                 this.collection = options.ctl.ctx.collections[collection];
    //             }
    //             View.call(this, options);
    
    //             this.itemViewOptions = this.options.itemViewOptions || this.itemViewOptions;
    //             this.itemViewOptions = this.itemViewOptions || {};
    //             this._itemViews = {};
    //             this._emptyViews = {};
    //             this._isEmptyViewShown = {};
    //             return this;
    //         },
    
    //         getInnerHtml: function () {
    //             return this._getCollectionHtml(View.prototype.getInnerHtml.call(this));
    //         },
    
    //         getItemView: function (model, collection) {
    //             return this._getItemEmptyView('itemView', collection);
    //         },
    
    //         getEmptyView: function (collection) {
    //             return this._getItemEmptyView('emptyView', collection);
    //         },
    
    //         resolveView: function (viewName) {
    //             return this._itemEmptyViewConstructors[viewName];
    //         },
    
    //         addItemView: function (view, $target, collection) {
    //             $target.append(view.el);
    //             return this;
    //         },
    
    //         removeItemView: function (view, $target, collection) {
    //             view.remove();
    //             return this;
    //         },
    
    //         renderCollection: function (views, $target, collection) {
    //             _.each(views, function (view) {
    //                 $target.append(view.el);
    //             });
    //             return this;
    //         },
    
    //         getCollections: function () {
    //             var collectionNames = this._findCollectionNames(View.prototype.getInnerHtml.call(this)),
    //                 collections = [],
    //                 collection,
    //                 self = this;
    
    //             if (this.collection) {
    //                 if (_.isString(this.collection) && (collection = this.ctl.ctx.collections[this.collection])) {
    //                     collections.push(collection);
    //                 } else {
    //                     collections.push(this.collection);
    //                 }
    //             } else if (collectionNames && collectionNames.length) {
    //                 collections = _.map(collectionNames, function (collectionName) {
    //                     return self._getCollection(collectionName);
    //                 });
    //             }
    
    //             return collections;
    //         },
    
    //         getItemEmptyViews: function () {
    //             var self = this,
    //                 views = [],
    //                 view;
    
    //             _.each(this.getCollections(), function (collection) {
    //                 if (collection.length) {
    //                     collection.each(function (model) {
    //                         views.push(self._getItemViewInstance(model, collection));
    //                     });
    //                 } else {
    //                     if ((view = self._getEmptyViewInstance(collection))) {
    //                         views.push(view);
    //                     }
    //                 }
    //             });
    
    //             return views;
    //         },
    
    //         attachItemViews: function () { // TODO: make private method
    //             var collectionNames = this._findCollectionNames(this.$el.html()),
    //                 self = this,
    //                 attachItemView,
    //                 iterateAndListen,
    //                 view,
    //                 View;
    
    //             attachItemView = function (view, $el) {
    //                 renderer.attachView(view, $el[0]);
    //             };
    
    //             iterateAndListen = function (collection, name) {
    //                 self._listenToCollection(collection);
    
    //                 if (!collection.length) {
    //                     if ((view = self._getEmptyViewInstance(collection))) {
    //                         self._isEmptyViewShown[collection.cid] = true;
    //                         renderer.attachView(view, self._getCollectionTarget(collection).children()[0]);
    //                     }
    //                 } else {
    //                     collection.each(function (model) {
    //                         var $el = self._getViewEl(model);
    //                         attachItemView(self._getItemViewInstance(model, collection, { cid: $el.attr('lazo-view-id') }), $el);
    //                     });
    //                 }
    //             };
    
    //             if (collectionNames) {
    //                 _.each(collectionNames, function (name) {
    //                     var c = self._getCollection(name);
    //                     if(c){
    //                         iterateAndListen(c, name);
    //                     }
    //                 });
    //             } else if (this.collection) {
    //                 iterateAndListen(this.collection);
    //             }
    
    //             return this;
    //         },
    
    //         // Atrribute used to mark collection targets.
    //         _targetAttr: 'lazo-collection-target',
    
    //         // Hash of item view instances. Key is the model id associated to the view instance.
    //         _itemViews: null,
    
    //         // Hash of empty view instances. Key is the collection id associated to the view instance.
    //         _emptyViews: null,
    
    //         // Used to store the showing state of a collection empty view.
    //         _isEmptyViewShown: null,
    
    //         // Generates a string representation of item view instances el or an empty view el if collection is not populated.
    //         _getItemViewsHtml: function (collection) {
    //             var html = '',
    //                 self = this,
    //                 view;
    
    //             if (!collection.length) {
    //                 if ((view = this._getEmptyViewInstance(collection))) {
    //                     this._isEmptyViewShown[collection.cid] = true;
    //                     return view.getHtml();
    //                 } else { // empty view not defined
    //                     return html;
    //                 }
    //             }
    
    //             this._removeEmptyView(collection);
    //             collection.each(function (model) {
    //                 html += self._getItemViewInstance(model, collection).getHtml();
    //             });
    
    //             return html;
    //         },
    
    //         /**
    //          * Returns name of view to be used by collection based on view type, item or empty.
    //          *
    //          * views: {
    //          *     collectionName: {
    //          *         itemView: 'itemView',
    //          *         emptyView: ['emptyView1', 'emptyView2']
    //          *     }
    //          * }
    //          *
    //          * itemView: ['itemView1', 'itemView2'],
    //          * emptyView: 'emptyView',
    //          */
    //         _getItemEmptyViewName: function (type, collection) {
    //             var collectionName = this._getCollectionName(collection),
    //                 viewName = collectionName && this.views && this.views[collectionName] ? this.views[collectionName][type] :
    //                     this[type];
    
    //             return _.isArray(viewName) ? viewName[0] : viewName;
    //         },
    
    //         // Returns the view constructor to be used by collection based on view type, item or empty.
    //         _getItemEmptyView: function (type, collection) {
    //             var viewName = this._getItemEmptyViewName(type, collection);
    
    //             if (!viewName && type === 'emptyView') {
    //                 return;
    //             } else if (!viewName) {
    //                 throw type + ' view not found.';
    //             }
    
    //             return this.resolveView(viewName);
    //         },
    
    //         // Gets the name of a collection.
    //         _getCollectionName: function (collection) {
    //             var collections;
    //             if (this.collection) {
    //                 if (!_.isString(this.collection)) {
    //                     return COLLECTION_SPECIFIER;
    //                 } else {
    //                     return;
    //                 }
    //             }
    
    //             collections = this.ctl.ctx.collections;
    //             for (var key in collections) {
    //                 if (collections[key] === collection) {
    //                     return key;
    //                 }
    //             }
    //         },
    
    //         // Gets the item view $el for a model.
    //         _getViewEl: function (model) {
    //             return this.$('[lazo-model-id="' + model.cid + '"]');
    //         },
    
    //         // Sets up view, does internal cleanup, and calls public method.
    //         _addItemView: function (model, collection) {
    //             var view = this._getItemViewInstance(model, collection);
    
    //             this._removeEmptyView(collection);
    //             view.render();
    //             view.afterRender();
    //             this.addItemView(view, this._getCollectionTarget(collection), collection);
    //             return this;
    //         },
    
    //         // Destroys view, does internal cleanup, and calls public method.
    //         _removeItemView: function (model, collection) {
    //             var view,
    //                 self = this;
    
    //             if(this._itemViews[model.cid]){
    //                 this._itemViews[model.cid].once('remove', function () {
    //                     renderer.cleanupView(self._itemViews[model.cid]);
    //                     delete self._itemViews[model.cid];
    //                 });
    //                 this.removeItemView(this._itemViews[model.cid], this._getCollectionTarget(collection), collection);
    //             }
    
    //             if (!collection.length) {
    //                 if ((view = this._getEmptyViewInstance(collection))) {
    //                     this._isEmptyViewShown[collection.cid] = true;
    //                     view.render();
    //                     this.addItemView(view, this._getCollectionTarget(collection), collection);
    //                 }
    //             }
    //             return this;
    //         },
    
    //         // Gets the collection target $el
    //         _getCollectionTarget: function (collection) {
    //             var name = this._getCollectionName(collection);
    //             return name ? $('[' + this._targetAttr + '="' + name + '"]') : this.$el;
    //         },
    
    //         // Renders a collection on the client.
    //         _renderCollection: function (collection) {
    //             var self = this,
    //                 views = [],
    //                 $target = self._getCollectionTarget(collection),
    //                 view;
    
    //             // Empty existing collection
    //             $target.empty();
    
    //             if (!collection.length) {
    //                 if ((view = this._getEmptyViewInstance(collection))) {
    //                     this._isEmptyViewShown[collection.cid] = true;
    //                     view.render();
    //                     self.renderCollection([view], self._getCollectionTarget(collection), collection);
    //                     return this;
    //                 } else { // empty view not defined
    //                     self.renderCollection([], self._getCollectionTarget(collection), collection);
    //                     return this;
    //                 }
    //             }
    
    //             this._removeEmptyView(collection);
    //             collection.each(function (model) {
    //                 view = self._getItemViewInstance(model, collection);
    //                 view.render();
    //                 views.push(view);
    //             });
    
    //             self.renderCollection(views, self._getCollectionTarget(collection));
    //             return this;
    //         },
    
    //         _removeEmptyView: function (collection) {
    //             var view,
    //                 self = this;
    
    //             if (this._isEmptyViewShown[collection.cid]) {
    //                 view = this._emptyViews[collection.cid];
    //                 this._isEmptyViewShown[collection.cid] = false;
    
    //                 view.once('remove', function () {
    //                     renderer.cleanupView(view);
    //                     delete self._emptyViews[collection.cid];
    //                 });
    //                 this.removeItemView(view, this._getCollectionTarget(collection), collection);
    //             }
    
    //             return this;
    //         },
    
    //         _listenToCollection: function (collection) {
    //             this.listenTo(collection, 'add', this._addItemView, this);
    //             this.listenTo(collection, 'remove', this._removeItemView, this);
    //             this.listenTo(collection, 'reset', this._renderCollection, this);
    
    //             return this;
    //         },
    
    //         _getCollection: function (name) {
    //             return name === COLLECTION_SPECIFIER ? this.collection : this.ctl.ctx.collections[name];
    //         },
    
    //         _getCollectionHtml: function (html) {
    //             var collectionNames = this._findCollectionNames(html),
    //                 self = this,
    //                 collectionHtml = {};
    
    //             if (collectionNames.length) { // collection targets defined in template; get html for each collection
    //                 _.each(collectionNames, function (collectionName) {
    //                     collectionHtml[collectionName] = self._getItemViewsHtml(self._getCollection(collectionName));
    //                 });
    //                 return this._insertCollectionHtml(collectionNames, collectionHtml, html);
    //             } else if (this.collection) { // collection is inserted directly under this.el
    //                 return this._getItemViewsHtml(this.collection);
    //             } else { // no collection found or defined
    //                 return html;
    //             }
    //         },
    
    //         _insertCollectionHtml: function (collectionNames, collectionHtml, htmlBuffer) {
    //             var match,
    //                 htmlOpen,
    //                 htmlClose,
    //                 self = this;
    
    //             _.each(collectionNames, function (collectionName) {
    //                 match = renderer.getInsertIndex(self._targetAttr, collectionName, htmlBuffer);
    //                 htmlOpen = htmlBuffer.substr(0, match.index + match[0].length);
    //                 htmlClose = htmlBuffer.substr(match.index + match[0].length);
    //                 htmlBuffer = htmlOpen + collectionHtml[collectionName] + htmlClose;
    //             });
    
    //             return htmlBuffer;
    //         },
    
    //         _findCollectionNames: function (html) { // TODO: there has to be a better regex; shouldn't need the while loop
    //             var htmlSubstr = html,
    //                 match = true,
    //                 names = [],
    //                 start = 0;
    
    //             while (match) {
    //                 htmlSubstr = htmlSubstr.substr(start);
    //                 match = htmlSubstr.match(/<[^>]*\s(?:lazo-collection-target=["']([^"']*)["'])[^>]*>/); // TODO: use this._targetAttr
    //                 if (match) {
    //                     names.push(match[1]);
    //                     start = match[0].length + match.index;
    //                 }
    //             }
    
    //             return names;
    //         },
    
    //         _getEmptyViewInstance: function (collection) {
    //             var view,
    //                 View,
    //                 self = this,
    //                 name;
    
    //             if (!(view = self._emptyViews[collection.cid])) {
    //                 if ((view = this._createItemEmptyView('emptyView', collection, { collection: collection }))) {
    //                     self._emptyViews[collection.cid] = view;
    //                 }
    //             }
    
    //             return view;
    //         },
    
    //         _getItemViewInstance: function (model, collection, options) {
    //             var view,
    //                 View,
    //                 self = this,
    //                 name;
    
    //             if (!(view = self._itemViews[model.cid])) {
    //                 options = options || {};
    //                 view = self._itemViews[model.cid] = this._createItemEmptyView('itemView', collection, _.extend({ model: model }, options));
    //             }
    
    //             return view;
    //         },
    
    //         _createItemEmptyView: function (viewType, collection, options) {
    //             var self = this,
    //                 name = this._getItemEmptyViewName(viewType, collection),
    //                 View = viewType === 'itemView' ? self.getItemView(options.model, collection) :
    //                     self.getEmptyView(collection);
    
    
    //             if (!View) { // empty view not defined
    //                 return;
    //             }
    
    //             // template values cannot be determined during construction because view instances
    //             // are constucted by the controller to determine the template dependencies for
    //             // a collection view item and empty views.
    //             return new View(_.extend({
    //                 ctl: self.ctl,
    //                 collection: collection,
    //                 name: name,
    //                 ref: self.ctl._getPath(name, 'view'),
    //                 baseBath: self.ctl._getBasePath(name, 'view'),
    //                 render: function () {
    //                     if (!_.isFunction(this.template)) {
    //                         this.template = self._getItemEmptyViewTemplate(this);
    //                     }
    //                     this.$el.html(this.getInnerHtml());
    //                     return this;
    //                 },
    //                 getInnerHtml: function () {
    //                     if (!_.isFunction(this.template)) {
    //                         this.template = self._getItemEmptyViewTemplate(this);
    //                     }
    //                     return View.prototype.getInnerHtml.call(this);
    //                 }
    //             }, options));
    //         },
    
    //         _getItemEmptyViewTemplate: function (view) {
    //             var templateName = _.result(view, 'templateName') || view.name,
    //                 template = this._itemEmptyViewTemplates[templateName];
    
    //             // this._itemEmptyViewTemplates contents differ depending on how and when they were populated
    //             return _.isObject(template) ? template.template : this._templateEngine.compile(template);
    //         },
    
    //         _onRemove: function () {
    //             var self = this;
    //             _.each(this._itemViews, function (view, key) {
    //                 renderer.cleanupView(view);
    //                 delete self._itemViews[key];
    //             });
    
    //             _.each(this._emptyViews, function (view, key) {
    //                 renderer.cleanupView(view);
    //                 delete self._emptyViews[key];
    //             });
    
    //             return this;
    //         }
    
    //     });
    
    //     return LazoCollectionView;
    
    // });
    slinky.CollectionView = CollectionView;

    return slinky;

})(this, Backbone, _);