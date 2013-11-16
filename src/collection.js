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
            var View = slinky.View.extend({
                template: ''
            });
        } finally {
            callback(View);
        }
    },

    getEmptyView: function (collection, callback) {
        var View = slinky.View.extend({
            template: ''
        });
        callback(View);
    },

    addItemView: function ($target, view, callback) {
        $target.append(view);
        callback();
    },

    addEmptyView: function ($target, view, callback) {
        $target.append(view);
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
                $target = this.$('[slinky-collection="' + collections[i].name + '"]');
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
        slinky.View.prototype.call(this);
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
        function addItemView($target, model, collection) {
            self._getEmptyItemViewInstance(model, collection, function (itemView) {
                itemView.render(function () {
                    self.addItemView($target, view, function () {
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
            addItemView($target, model, collection);
        }
    },

    _collectionAdd: function (model, collection) {
        var collectionDef = this._findCollection(collection);
        this._addItemView(model, collectionDef, function () {});
    },

    _collectionRemove: function (model, collection) { // TODO: check if there are no more items in the collection
        var collectionDef = this._findCollection(collection);
        var $target = this.$('[slinky-collection="' + collections[i].name + '"]');
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
            if (collectionDef.emptyView) {
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
            match = htmlSubstr.match(/<[^>]*\s(?:slinky-collection=["']([^"']*)["'])[^>]*>/);
            if (match) {
                names.push(match[1]);
                start = match[0].length + match.index;
            }
        }

        return names;
    }

});