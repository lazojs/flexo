describe('Flexo Base View', function () {
    var view;
    var View;

    function onClick(e) {
        this.trigger('click', { e: e });
    }

    before(function () {
        var View = flexo.View.extend({
            attributes: {
                'data-foo': 'bar'
            },
            childOptions: {
                foo: 1,
                bar: 2,
                baz: 3
            },
            events: { 'click': onClick },
            template: 'Hi! My name is <%=fname%> <%=lname%> <div flexo-view="foo"></div> More text.',
            serializeData: function (options) {
                options.success({ fname: 'Jason', lname: 'Strimpel' });
            },
            onRemove: function () {
                return 'removed';
            },
            children: {
                foo: flexo.View.extend({
                    events: { 'click': onClick },
                    template: 'I am the child view!!!<div flexo-view="bar"></div> Even more text.',
                    children: {
                        bar: flexo.View.extend({
                            events: { 'click': onClick },
                            template: 'I am the grandchild view!!!'
                        })
                    }
                })
            }
        });

        $('body').append('<div id="flexo">');
        view = new View({
            el: '#flexo',
            opt1: true,
            opt2: false
        });
    });

    describe('#render()', function (foo) {
        it('should render self and children', function (done) {
            var eventSpy = sinon.spy();
            var afterSpy = sinon.spy(view, 'afterRender');

            view.once('flexo:rendered', eventSpy);
            view.render({
                error: function (err) {
                    throw err;
                },
                success: function (html) {
                    expect(html).to.be.equal($('#flexo').html());
                    expect(afterSpy.calledOnce).to.be.true;
                    afterSpy.restore();
                    // wait for event to be triggered
                    setTimeout(function () {
                        expect(eventSpy.calledOnce).to.be.true;
                        done();
                    }, 10);
                }
            });
        });
    });

    describe('#augment()', function () {
        it('should augment instance with all options', function () {
            expect(view.el).to.be.equal($('#flexo')[0]);
            expect(view.opt1).to.be.true;
            expect(view.opt2).to.be.false;
        });
    });

    describe('#attach(), #attachChildViews()', function () {
        it('should attach the view and children', function (done) {

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
            var childSpy = sinon.spy(view.children.foo, 'onAttach');
            var grandchildSpy = sinon.spy(view.children.foo.children.bar, 'onAttach');
            var eventSpy = sinon.spy();
            // listen for events to be triggered
            view.once('flexo:attached', eventSpy);
            view.children.foo.once('flexo:attached', eventSpy);
            view.children.foo.children.bar.once('flexo:attached', eventSpy);

            view.attach($('#flexo-attach')[0], {
                success: function () {
                    expect(eventSpy.calledThrice).to.be.true;
                    clickListen(view, function () {
                        clickListen(view.children.foo, function () {
                            clickListen(view.children.foo.children.bar, function () {
                                expect(parentSpy.calledOnce).to.be.true;
                                expect(childSpy.calledOnce).to.be.true;
                                expect(grandchildSpy.calledOnce).to.be.true;
                                parentSpy.restore();
                                childSpy.restore();
                                grandchildSpy.restore();
                                view.attach($('#flexo')[0], {
                                    success: function () {
                                        $('#flexo-attach').remove();
                                        done();
                                    }
                                });
                            });
                        });
                    });
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#getAttributes()', function () {
        it('should get the attributes for a view', function () {
            var expected = { 'flexo-view-id': null };
            expected['flexo-view-id'] = view.cid;
            expect(view.getAttributes()).to.deep.equal(expected);
        });
    });

    describe('#getHtml()', function () {
        it('should get the html string for a view', function (done) {
            view.getHtml({
                success: function (html) {
                    var regex = /<div data-foo="bar" flexo-view-id="view[0-9]+">Hi! My name is Jason Strimpel <div flexo-view="foo"><div flexo-view-id="view[0-9]+">I am the child view!!!<div flexo-view="bar"><div flexo-view-id="view[0-9]+">I am the grandchild view!!!<\/div><\/div> Even more text.<\/div><\/div> More text.<\/div>/
                    var match = html.match(regex);

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

    describe('#getInnerHtml()', function () {
        it('should get the inner html string for a view', function (done) {
            view.getInnerHtml({
                success: function (html) {
                    var regex = /Hi! My name is Jason Strimpel <div flexo-view="foo"><div flexo-view-id="view[0-9]+">I am the child view!!!<div flexo-view="bar"><div flexo-view-id="view[0-9]+">I am the grandchild view!!!<\/div><\/div> Even more text.<\/div><\/div> More text./
                    var match = html.match(regex);

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

    describe('#getRenderer()', function () {
        it('should get the renderer for a view', function (done) {
            view.getRenderer({
                success: function (renderer) {
                    expect(renderer).to.be.equal(view.renderer);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#getTemplateEngine()', function () {
        it('should get the template engine for a view', function (done) {
            view.getTemplateEngine({
                success: function (engine) {
                    expect(engine).to.be.equal(_.template);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#serializeData()', function () {
        it('should get the data for rendering a view', function (done) {
            view.serializeData({
                success: function (data) {
                    expect(data).to.deep.equal({ fname: 'Jason', lname: 'Strimpel' });
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#transformData()', function () {
        it('should get the data for manipulation', function (done) {
            view.transformData({ fname: 'Jason', lname: 'Strimpel' }, {
                success: function (data) {
                    expect(data).to.deep.equal({ fname: 'Jason', lname: 'Strimpel' });
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#setElement()', function () {
        it('should set the flexo attributes for the view element', function () {
            var spy = sinon.spy(view, '_setElAttributes');
            view.setElement(view.$el[0], false);
            expect(spy.calledOnce).to.be.true;
            spy.restore();
        });

        it('should delegate to Backbone.View.prototype.setElement', function () {
            var spy = sinon.spy(Backbone.View.prototype, 'setElement');
            view.setElement(view.$el[0], false);
            expect(spy.calledOnce).to.be.true;
            spy.restore();
        });
    });

    describe('#getChildren()', function () {
        it('should get the children for a view', function (done) {
            view.getChildren({
                success: function (children) {
                    expect(view.children.foo).to.be.equal(children.foo);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#addChild()', function () {
        it('should add a child view', function (done) {
            view.$el.append('<div flexo-view="baz">');
            view.addChild('baz', view.$('[flexo-view="baz"]'), {
                success: function () {
                    expect(view.children.baz).to.be.instanceof(flexo.View);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#loadChild()', function () {
        it('should load a child view constructor', function (done) {
            view.loadChild('baz', {
                success: function (View) {
                    expect(View).to.be.equal(flexo.View);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#resolveChild()', function () {
        it('should load a child view instance', function (done) {
            view.resolveChild('foo', {
                success: function (childView) {
                    expect(childView).to.be.equal(view.children.foo);
                    done();
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#appendChild()', function () {
        it('should append child view instance to the DOM', function (done) {
            var spy = sinon.spy();
            var viewToBeAppended = new flexo.View();
            view.$el.append('<div flexo-view="alpha">');
            view.once('flexo:child:added', spy);
            view.appendChild($('[flexo-view="alpha"]'), viewToBeAppended, {
                success: function (childView) {
                    // TODO: fix this!!!
                    // for some reason, ONLY in phantomjs, view.appendChild is appending 2 elements with the same id
                    // so we need to grab the last one; there are actually a total of 3 elements
                    expect($('[flexo-view="alpha"]').find('[flexo-view-id]').last().attr('flexo-view-id')).to.be.equal(viewToBeAppended.cid);
                    // wait for event to be triggered
                    setTimeout(function () {
                        expect(spy.calledOnce).to.be.true;
                        done();
                    }, 10);
                },
                error: function (err) {
                    throw err;
                }
            });
        });
    });

    describe('#getChildOptions()', function () {
        it('should set the options for child view contruction', function () {
            expect(view.getChildOptions()).to.deep.equal({
                foo: 1,
                bar: 2,
                baz: 3
            });
        });
    });

    // // run last
    describe('#remove()', function () {
        it('should remove a view and its children', function () {
            // ensure remove callbacks are executed
            var onRemoveSpy = sinon.spy(view, 'onRemove');
            var _onRemoveSpy = sinon.spy(view, '_onRemove');
            var eventSpy = sinon.spy();
            // listen for events to be triggered
            view.once('flexo:removed', eventSpy);

            view.remove();

            expect(eventSpy.calledOnce).to.be.true;
            expect(onRemoveSpy.calledOnce).to.be.true;
            expect(_onRemoveSpy.calledOnce).to.be.true;
            onRemoveSpy.restore();
            _onRemoveSpy.restore();
        });
    });
});