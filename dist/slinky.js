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
            options || (options = {});
            _.extend(this, options);
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
    
        _collections: [],
    
        _itemViews: {},
    
        _emptyViews: {},
    
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
    
        getItemView: function (model, collection, callback) {
            try {
                var View = this.itemViews[this._findCollection(collection).name];
            } catch (e) {
                var View = slinky.View.extend({
                    template: ''
                });
            }
            callback(View);
        },
    
        getEmptyView: function (collection, callback) {
            var View = slinky.View.extend({
                template: ''
            });
            callback(View);
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
                this._getEmptyViewInstance(null, collection, function (emptyView) {
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
                    self._getEmptyViewInstance(model, collection, function (itemView) {
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
    
        _getEmptyViewInstance: function (model, collection, callback) {
            var self = this;
    
    console.log('message 1');
            if (model) {
                this.getItemView(model, collection, function (ItemView) {
    console.log('message 2');
                    callback(new ItemView(self._getItemViewOptions({ model: model })));
                });
            } else {
                this.getEmptyView(collection, function (EmptyView) {
                    callback(new EmptyView(self._getItemViewOptions()));
                });
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
    slinky.CollectionView = CollectionView;

    return slinky;

})(this, Backbone, _);