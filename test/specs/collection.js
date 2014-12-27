describe('Flexo Collection View', function () {
    var view;
    var View;

    before(function () {
        var ItemView = flexo.View.extend({
            tagName: 'li',
            serializeData: function (options) {
                options.success(this.model.toJSON());
            },
            template: '<%=name%>'
        });

        View = flexo.CollectionView.extend({
            template: '<ul flexo-collection-target="foo"></ul><p>Hi! My name is <%=fname%> <%=lname%>.</p><ul flexo-collection-target="bar"></ul>',
            serializeData: function (options) {
                options.success({ fname: 'Jason', lname: 'Strimpel' });
            },
            itemViews: {
                foo: ItemView,
                bar: ItemView
            },
            collections: {
                foo: new Backbone.Collection([
                    { name: 'Roger' },
                    { name: 'Steve' }
                ]),
                bar: new Backbone.Collection([
                    { name: 'Brian' },
                    { name: 'Peter' }
                ])
            }
        });

        view = new View({
            el: '#flexo'
        });
    });

    after(function () {
        view.remove();
        $('body').append('<div id="flexo">');
    });

    describe('#render()', function (foo) {
        it('should render self and item views', function (done) {
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
});