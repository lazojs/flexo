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