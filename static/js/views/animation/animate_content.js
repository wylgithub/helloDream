define([
    'require',
    'jquery',
    'backbone'
], function (require, $, Backbone) {
    "use strict";

    return Backbone.View.extend({
        counter: 0,

        initialize: function() {
            this.container = $(this.options.container);
            this.content = this.container.html();
        },

        start: function() {
            var _view = this;
            if (this.interval_id) {
                window.clearInterval(this.interval_id);
            }
            this.interval_id = window.setInterval(function() {
                if (_view.counter >= _view.content.length) {
                    _view.counter = 1;
                }else {
                    _view.counter++;
                }
                _view.container.html(_view.content.substring(0, _view.counter));

            }, 200);
            return this;
        },

        stop: function() {
            if (this.interval_id) {
                window.clearInterval(this.interval_id);
            }
            return this;
        }

    });
});