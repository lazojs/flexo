var CollectionView = View.extend({

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

        View.prototype.getInnerHtml.call(this, function (err, innerHtml) {
            if (err) {
                return callback(err, null);
            }
            self._getCollectionHtml(innerHtml, function (err, collectionInnerHtml) {
                if (err) {
                    return callback(err, null);
                }
                callback(null, collectionInnerHtml);
            });
        });
    },

    getCollection: function (nameCollection, callback) {
        if (_.isString(nameCollection)) {
            this.resolveCollection(nameCollection, callback);
        } else if (nameCollection instanceof Backbone.Collection) {
            callback(null, nameCollection);
        } else {
            callback(null, new Backbone.Collection());
        }
    },

    resolveCollection: function (name, callback) {
        try {
            var collection = this.collections[name];
            callback(null, collection);
        } catch (e) {
            callback(e, null);
        }
    },

    getItemView: function (model, collection, callback) {
        try {
            var View = this.itemViews[this._findCollection(collection).name];
            callback(null, View);
        } catch (e) {
            callback(e, null);
        }
    },

    getEmptyView: function (collection, callback) {
        try {
            var View = this.emptyViews[this._findCollection(collection).name];
            callback(null, View);
        } catch (e) {
            callback(e, null);
        }
    },

    addItemView: function ($target, view, callback) {
        $target.append(view.$el);
        callback(null, view);
        this.trigger(this.eventNameSpace + 'itemView:added', view);
    },

    addEmptyView: function ($target, view, callback) {
        $target.append(view.$el);
        callback(null, view);
        this.trigger(this.eventNameSpace + 'emptyView:added', view);
    },

    removeEmptyView: function ($target, view, callback) {
        view.remove();
        callback(null, true);
        this.trigger(this.eventNameSpace + 'itemView:removed');
    },

    removeItemView: function ($target, view, callback) {
        view.remove();
        callback(null, true);
        this.trigger(this.eventNameSpace + 'emptyView:removed');
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

        for (var i = 0; i < length; i++) {
            (function (i) {
                $target = this.$('[' + self.attributeNameSpace + '-collection-target="' + collections[i].name + '"]');
                if (collections[i].length) {
                    collections[i].each(function (model) {
                        self.this._addItemView(model, collections[i], function () {
                            itemViewsAdded++;
                            if (itemViewsToBeAdded === itemViewsAdded) {
                                callback(null, true); // TODO: trigger collection render
                                self.trigger(self.eventNameSpace + 'collection:rendered', collections[i]);
                            }
                        });
                    });
                } else { // empty view
                    this._getEmptyItemViewInstance(null, collections[i], function (err, emptyView) {
                        if (err) {
                            return callback(err, null);
                        }
                        if (emptyView) {
                            emptyView.render(function () {
                                self.addEmptyView($target, view, function (err, result) { // TODO: trigger add empty view
                                    if (err) {
                                        return callback(err, null);
                                    }
                                    callback(null, result);
                                    self.trigger(self.eventNameSpace + 'collection:rendered', collections[i]);
                                });
                            });
                        } else {
                            callback(null, true);
                            self.trigger(self.eventNameSpace + 'collection:rendered', collections[i]);
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
        this.trigger(this.eventNameSpace + 'itemViews:attached');
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
        collection.emptyView = view;
        return view;
    },

    _collections: [],

    _itemViews: {},

    _listenToCollection: function (collection) {
        this.listenTo(collection, 'add', this._collectionAdd, this);
        this.listenTo(collection, 'remove', this._collectionRemove, this);
        this.listenTo(collection, 'reset', this._collectionReset, this);
    },

    _addItemView: function (model, collectionDef, callback) {
        var $target = this.$('[' + this.attributeNameSpace + '-collection-target="' + collectionDef.name + '"]');
        var self = this;

        function addItemView($target, model, collection) {
            self._getEmptyItemViewInstance(model, collection, function (err, itemView) {
                if (err) {
                    return callback(err, null);
                }
                itemView.render(function (err, html) {
                    if (err) {
                        return callback(err, null);
                    }
                    self.addItemView($target, itemView, function (err, result) {
                        if (err) {
                            return callback(err, null);
                        }
                        callback(null, result);
                        self.trigger(self.eventNameSpace + 'itemView:added', itemView);
                    });
                });
            });
        }

        if (collectionDef.emptyViewShown) {
            self.removeEmptyView($target, collectionDef.emptyView, function (err, result) {
                if (err) {
                    return callback(err, null);
                }
                addItemView($target, model, collectionDef.collection);
            });
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

        this.removeItemView($target, view, function (err, result) { // TODO: trigger remove event
            if (err) {
                throw err;
            }
            if (!collection.length) {
                this._getEmptyItemViewInstance(null, collection, function (err, emptyView) {
                    if (err) {
                        throw err;
                    }
                    if (emptyView) {
                        self.addEmptyView($target, emptyView, function (err, result) { // TODO: trigger empty view add event
                            if (err) {
                                throw err;
                            }
                            self.trigger(self.eventNameSpace + 'emptyView:removed', collection);
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
                callback(null, self._insertCollectionHtml(collectionNames, collectionHtml, html));
            }
        }

        if (collectionNames.length) { // collection targets defined in html; get html for each collection
            collectionsCount = collectionNames.length;
            for (var i = 0; i < collectionNames.length; i++) {
                (function (i) {
                    self.getCollection(collectionNames[i], function (err, collection) {
                        if (err) {
                            callback(err, null);
                        }
                        self._addCollection(collectionNames[i], collection);
                        self._getItemViewsHtml(collection, function (err, itemViewsHtml) {
                            if (err) {
                                callback(err, null);
                            }
                            collectionHtml[collectionNames[i]] = itemViewsHtml;
                            isDone();
                        });
                    });
                })(i);
            }
        } else if (this.collection) { // collection is inserted directly under this.el
            self.getCollection(this.collection, function (err, collection) {
                if (err) {
                    callback(err, null);
                }
                self._getItemViewsHtml(collection, function (err, itemViewsHtml) {
                    if (err) {
                        callback(err, null);
                    }
                    callback(null, itemViewsHtml);
                });
            });
        } else { // no collection found or defined
            return html;
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

    _getItemViewsHtml: function (collection, callback) {
        var html = '';
        var self = this;
        var view;
        var itemViewsCreated = 0;

        function isDone() {
            itemViewsCreated++;
            if (collection.length === itemViewsCreated) {
                callback(null, html);
            }
        }

        if (!collection.length) {
            this._getEmptyItemViewInstance(null, collection, function (err, emptyView) {
                if (err) {
                    callback(err, null);
                }
                self._setEmptyViewStatus(collection, true);
                if (emptyView) {
                    emptyView.getHtml(function (err, html) {
                        if (err) {
                            callback(err, null);
                        }
                        callback(null, html);
                    });
                } else {
                    callback(null, html);
                }
            });
        } else {
            self._setEmptyViewStatus(collection, false);
            collection.each(function (model) {
                self._getEmptyItemViewInstance(model, collection, function (err, itemView) {
                    if (err) {
                        callback(err, null);
                    }
                    itemView.getHtml(function (err, itemViewHtml) {
                        if (err) {
                            callback(err, null);
                        }
                        html += itemViewHtml;
                        isDone();
                    });
                });
            });
        }
    },

    _getItemViewOptions: function (options) {
        options || (options = {});
        return _.extend(options, _.result(this, 'itemViewOptions'));
    },

    _getEmptyItemViewInstance: function (model, collection, callback) {
        var self = this;
        var view;
        var collectionDef = this._findCollection(collection);

        if (model) {
            if (self._itemViews[model.cid]) {
                return callback(null, self._itemViews[model.cid]);
            }

            this.getItemView(model, collection, function (err, ItemView) {
                if (err) {
                    callback(err, null);
                }
                callback(null, self.createItemView(ItemView, model, collection));
            });
        } else {
            if (collectionDef && collectionDef.emptyView) {
                return callback(null, collectionDef.emptyView);
            }

            this.getEmptyView(collection, function (err, EmptyView) {
                if (err) {
                    callback(err, null);
                }
                callback(null, self.createEmptyView(EmptyView, collection));
            });
        }
    },

    _setEmptyViewStatus: function (collection, status) {
        if (_.isNull(this._findCollection(collection))) {
            throw new Error('Could not find collection target in markup.');
        }

        collection.emptyViewShown = status;
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
    }

});