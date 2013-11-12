var slinky = (function (global, Backbone, _) {

    'use strict';

    // @include setup.js

    // @include base.js
    slinky.View = View;

    // @include collection.js
    slinky.CollectionView = CollectionView;

    return slinky;

})(this, Backbone, _);