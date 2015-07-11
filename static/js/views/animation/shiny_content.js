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
            this.shiny_flg = false;
        },

        start: function() {
            var _view = this;
            if (this.interval_id) {
                window.clearInterval(this.interval_id);
            }
            this.interval_id = window.setInterval(function() {
                if (_view.shiny_flg) {
                    _view.container.fadeIn();
                }else {
                    _view.container.fadeOut();
                }
                _view.shiny_flg = !_view.shiny_flg;
            }, 800);
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