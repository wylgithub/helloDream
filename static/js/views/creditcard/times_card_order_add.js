define([
    'require',
    'jquery',
    'backbone'
], function (require, $, Backbone) {
    "use strict";

    var AppView = Backbone.View.extend({
        el:"body",
        in_syncing:false,  //防止两重提交标志位

        events:{
            'click .dropdownItem': 'dropdownItem_click',
            'click #btnReturn': 'return_to_prev_page',
            'click #btnSave': 'save_click',
            'click #id_allow_exchange': 'allow_exchange_click'
        },

        // 选择
        dropdownItem_click:function(event) {
            var element = $(event.target);
            var id = element.attr('for');
            $("#" + id).val(element.attr('value'));
            $("#" + id + '_trigger').text(element.text());
        },

        // 保存
        save_click:function() {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            $('#btnSave').prop('disabled', true);

            $('#frmCreateTimesCardOrder').submit();
        },

        // 返回活动一览
        return_to_prev_page:function() {
            var ru = $('#next');
            var url;
            if (!ru || ru.length === 0 || !ru.val()) {
                url = '/credit_card/management/';
            }else {
                url = ru.val();
            }
            window.location.href = url;
        },

        // 可兑换文化通选择变化
        allow_exchange_click:function() {
            if ($(event.target).is(':checked')) {
                $('#id_exchange_value').removeClass('readonly').attr('readonly',false);
            } else {
                $('#id_exchange_value').addClass('readonly').attr('readonly', true);
            }
        }
    });
    return AppView;
});