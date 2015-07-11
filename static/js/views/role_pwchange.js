define([
    'require',
    'jquery',
    'backbone'
], function (require, $, Backbone) {
    "use strict";

    var AppView;
    AppView = Backbone.View.extend({
        el: "body",
        in_syncing: false, //防止两重提交标志位

        // 事件定义
        events: {
            'click #btnReturn': 'return_to_prev_page',
            'click #btnSave': 'save_click'
        },

        // 保存
        save_click:function() {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            $('#btnSave').prop('disabled', true);

            $('#frmPwChange').submit();
        },

        // 返回前画面
        return_to_prev_page:function() {
            var ru = $('#next');
            var url;
            if (!ru || ru.length === 0 || !ru.val()) {
                url = '/';
            }else {
                url = ru.val();
            }
            window.location.href = url;
        }
    });
    return AppView;
});