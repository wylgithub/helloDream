define([
    'backbone'
], function (Backbone) {
    "use strict";

    return Backbone.Router.extend({
        routes: {
            "create_order":"createOrder",  // 创建订单
            "bind_order_:id":"bindOrder",  // 绑定订单
            "bind_confirm_:id":"bindOrderConfirm",  // 绑定订单确认
            "bind_submit_:id":"bindOrderSubmit",  // 绑定订单确认
            "unbind_order_:id":"unbindOrder",  // 解除绑定
            "unbind_confirm_:id":"unbindOrderConfirm",  // 解除绑定订单确认
            "unbind_submit_:id":"unbindOrderSubmit"  // 解除绑定订单确认
        },

        initialize: function(options) {
            this._view = options.view;
        },

        bindOrder:function(id) {
            this._view.showBindOrderWindow(id);
        },

        bindOrderConfirm:function(id) {
            this._view.showBindOrderConfirmWindow(id);
        },

        bindOrderSubmit:function(id) {
            this._view.bindOrder(id);
        },

        unbindOrder:function(id) {
            this._view.showUnbindOrderWindow(id);
        },

        unbindOrderConfirm:function(id) {
            this._view.showUnbindOrderConfirmWindow(id);
        },

        unbindOrderSubmit:function(id) {
            this._view.unbindOrder(id);
        },

        createOrder:function() {
            this._view.createOrder();
        }
    });
});