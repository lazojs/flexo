describe('Flexo Base View', function () {
    var view;
    var View;

    before(function () {
        var View = flexo.View.extend({
            attributes: {
                'data-foo': 'bar'
            },
            template: 'Hi! My name is <%=fname%> <%=lname%> <div flexo-view="foo"></div> More text.',
            serializeData: function (options) {
                options.success({ fname: 'Jason', lname: 'Strimpel' });
            },
            onRemove: function () {
                return 'removed';
            },
            children: {
                foo: flexo.View.extend({
                    template: 'I am the child view!!!<div flexo-view="bar"></div> Even more text.',
                    children: {
                        bar: flexo.View.extend({
                            template: 'I am the grandchild view!!!'
                        })
                    }
                })
            }
        });

        view = new View({
            el: '#flexo',
            opt1: true,
            opt2: false
        });
    });

    after(function () {
        view.remove();
        $('body').append('<div id="flexo">');
    });

    describe('#render()', function (foo) {
        it('should render self and children', function (done) {
            view.render({
                error: function (err) {
                    throw err;
                },
                success: function (html) {
                    expect(html).to.be.equal($('#flexo').html());
                    done();
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
});