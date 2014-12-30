describe('Flexo Collection View', function () {
    var view;
    var View;
    var ItemView;
    var EmptyView

    before(function (done) {
        ItemView = flexo.View.extend({
            tagName: 'li',
            events: { 'click': onClick },
            serializeData: function (options) {
                options.success(this.model.toJSON());
            },
            template: '<%=name%>'
        });
        EmptyView = flexo.View.extend({
            tagName: 'li',
            events: { 'click': onClick },
            template: 'Nothing to see here.'
        });

        function onClick(e) {
            this.trigger('click', { e: e });
        }

        View = flexo.CollectionView.extend({
            template: '<ul flexo-collection-target="foo"></ul><p>Hi! My name is <%=fname%> <%=lname%>.</p><ul flexo-collection-target="bar"></ul>',
            events: { 'click': onClick },
            serializeData: function (options) {
                options.success({ fname: 'Jason', lname: 'Strimpel' });
            },
            itemViewOptions: {
                foo: 1,
                bar: 2,
                baz: 3
            },
            itemViews: {
                foo: ItemView,
                bar: ItemView
            },
            emptyViews: {
                bar: EmptyView
            },
            collections: {
                foo: new Backbone.Collection([
                    { name: 'Roger' },
                    { name: 'Steve' }
                ]),
                bar: new Backbone.Collection([])
            }
        });

        $('body').append('<div id="flexo">');
        view = new View({
            el: '#flexo'
        });

        view.render({
            success: function () {
                done();
            },
            error: function (err) {
                throw err;
            }
        });
    });

    after(function () {
        view.remove();
    });

    describe('#getInnerHtml()', function () {
        it('should get the html string for a view', function (done) {
            view.getInnerHtml({
                success: function (html) {
                    var regex = /<ul flexo-collection-target="foo"><li flexo-view-id="view[0-9]+">Roger<\/li><li flexo-view-id="view[0-9]+">Steve<\/li><\/ul><p>Hi! My name is Jason Strimpel.<\/p><ul flexo-collection-target="bar"><li flexo-view-id="view[0-9]+">Nothing to see here.<\/li><\/ul>/;
                    var match = html.match(regex);

                    expect(match).to.not.be.null;
                    expect(match.length).to.be.equal(1);
                    expect(match.index).to.be.equal(0);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#getCollection()', function () {
        it('should get a collection instance by name', function (done) {
            view.getCollection('foo', {
                success: function (collection) {
                    expect(collection).to.be.equal(view.collections.foo);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#resolveCollection()', function () {
        it('should resolve to a collection instance by name', function (done) {
            view.resolveCollection('foo', {
                success: function (collection) {
                    expect(collection).to.be.equal(view.collections.foo);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#getItemView()', function () {
        it('should get an item view constructor', function (done) {
            view.getItemView(view.collections.foo.at(0), view.collections.foo, {
                success: function (View) {
                    expect(View).to.be.equal(view.itemViews.foo);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#getEmptyView()', function () {
        it('should get an empty view constructor', function (done) {
            view.getEmptyView(view.collections.foo, {
                success: function (View) {
                    expect(View).to.be.undefined;
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#renderCollection()', function () {
        it('should render a collection', function (done) {
            var expected = 3;
            var rendered = 0;

            function isDone() {
                rendered++;
                if (expected === rendered) {
                    done();
                }
            }

            view.renderCollection(view.collections.bar, {
                success: function () {
                    // wait for DOM
                    setTimeout(function () {
                        expect($('[flexo-collection-target="foo"] li').length).to.be.equal(2);
                        expect($('[flexo-collection-target="bar"] li').length).to.be.equal(1);
                        isDone();
                    }, 0);
                },
                error: function (err) {
                    throw err;
                }
            });
            view.renderCollection(view.collections.foo, {
                success: function () {
                    // wait for DOM
                    setTimeout(function () {
                        expect($('[flexo-collection-target="foo"] li').length).to.be.equal(2);
                        expect($('[flexo-collection-target="bar"] li').length).to.be.equal(1);
                        isDone();
                    }, 0);
                },
                error: function (err) {
                    throw err;
                }
            });
            view.renderCollection({
                success: function () {
                    // wait for DOM
                    setTimeout(function () {
                        expect($('[flexo-collection-target="foo"] li').length).to.be.equal(2);
                        expect($('[flexo-collection-target="bar"] li').length).to.be.equal(1);
                        isDone();
                    }, 0);
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#attach(), #attachItemViews()', function () {
        it('should attach the view and item, empty views', function (done) {

            function clickListen(currentView, callback) {
                currentView.once('click', function (msg) {
                    expect(msg.e.currentTarget).to.be.equal(currentView.el);
                    expect(view.$el.attr('flexo-view-id')).to.be.equal(view.cid);
                    expect(view.el.id).to.be.equal('flexo-attach');
                    callback();
                });
                currentView.$el.trigger('click');
            }

            $('body').append('<div id="flexo-attach">' + view.$el.html() + '</div>');
            // ensure attach callbacks are executed
            var parentSpy = sinon.spy(view, 'onAttach');
            var eventSpy = sinon.spy();
            var itemSpy = sinon.spy();
            var emptySpy = sinon.spy();
            // listen for events to be triggered
            view.once('flexo:attached', eventSpy);
            view.once('flexo:itemViews:attached', eventSpy);
            for (var k in view._itemViews) {
                view._itemViews[k].once('flexo:attached', eventSpy);
            }
            for (var j in view._emptyViews) {
                view._emptyViews[j].once('flexo:attached', eventSpy);
            }

            view.attach($('#flexo-attach')[0], {
                success: function () {
                    var toBeClicked = 0;
                    var clicked = 0;
                    var viewTypes = ['_itemViews', '_emptyViews'];

                    function isDone() {
                        clicked++;
                        if (toBeClicked === clicked) {
                            view.attach($('#flexo')[0], {
                                success: function () {
                                    $('#flexo-attach').remove();
                                    done();
                                }
                            });
                        }
                    }

                    expect(eventSpy.callCount).to.be.equal(5);
                    expect(parentSpy.calledOnce).to.be.true;
                    parentSpy.restore();
                    toBeClicked++;
                    clickListen(view, function () {
                        isDone();
                    });
                    for (var i = 0; i < viewTypes.length; i++) {
                        for (var j = 0; j < view[viewTypes[i]].length; j++) {
                            toBeClicked++;
                            clickListen(view[viewTypes[i]][j], function () {
                                isDone();
                            });
                        }
                    }
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#getItemViewOptions()', function () {
        it('should get item view options', function () {
            expect(view.getItemViewOptions()).to.deep.equal({
                foo: 1,
                bar: 2,
                baz: 3
            });
        });
    });

    describe('#createItemView()', function () {
        it('should create an item view instance', function () {
            var itemView = view.createItemView(ItemView, view.collections.foo.at(0), view.collections.foo);
            expect(itemView).to.be.instanceof(ItemView);
        });
    });

    describe('#createEmptyView()', function () {
        it('should create an empty view instance', function () {
            var emptyView = view.createEmptyView(EmptyView, view.collections.bar);
            expect(emptyView).to.be.instanceof(EmptyView);
        });
    });
});