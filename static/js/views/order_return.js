define([
    'require',
    'jquery',
    'backbone',
    'editable'
], function (require, $, Backbone) {
    "use strict";

    var AppView;
    AppView = Backbone.View.extend({
        el:"body",
        in_syncing:false, //防止两重提交标志位

        // 事件定义
        events:{
            'click .btn-process-confirm': 'onProcessConfirm',
            'click .btn-cancel-confirm': 'onCancelConfirm',
            'click #btnReturn':'return_to_prev_page'
        },

        // 初始化
        initialize:function () {
            // 确定按钮提示信息
            $('#btnNext').popover({
                placement: "top",
                trigger: "hover",
                title: "提示",
                delay: {show:1000, hide:100},
                content: "请确认退票信息正确后继续。"
            });

            $(document).ready(function() {
                $('.tip').tooltip();
                if($('#excluded_error').val() == 1){
                    $('[name="data-type"]').editable({
                        disabled: true
                    });
                }else{
                    $('.tip').tooltip();
                    // 退票数量
                    $('.amount').editable({
                        emptytext: '空',
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }else {
                                $(".amount[data-pk='" + data.id + "']").parent().next().text(data.price);
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        },
                        validate: function(data){
                            if(data == '' || data < 0){
                                return '提示：请输入一个正整数。'
                            }
                        }
                    });
                    // 用户返票运单号
                    $('.user_express_no').editable({
                        emptytext: '空',
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        },
                        validate: function(data){
                            if(data != '' && $.trim(data) == ''){
                                return '提示：请输入正确的快递单号。'
                            }
                        }
                    });
                    // 用户返票运费
                    $('.user_express_cost').editable({
                        emptytext: '空',
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        },
                        validate: function(data){
                            if(data == '' || data < 0){
                                return '提示：请输入一个正整数。'
                            }
                        }
                    });
                    // 用户运费补偿
                    $('.user_express_subsidy').editable({
                        source: [{value: 'False', text: '否'}, {value: 'True', text: '是'}],
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        }
                    });
                    // 用户返票运单号
                    $('.tp_express_no').editable({
                        emptytext: '空',
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        },
                        validate: function(data){
                            if(data != '' && $.trim(data) == ''){
                                return '提示：请输入正确的快递单号。'
                            }
                        }
                    });
                    // 用户返票运费
                    $('.tp_express_cost').editable({
                        emptytext: '空',
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        },
                        validate: function(data){
                            if(data == '' || data < 0){
                                return '提示：请输入一个正整数。'
                            }
                        }
                    });
                    // 用户返票运费
                    $('.tp_discount').editable({
                        emptytext: '空',
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        },
                        validate: function(data){
                            if(data == '' || data < 0){
                                return '提示：请输入一个正整数。'
                            }
                        }
                    });
                    // 备注初期化
                    $('.remark').editable({
                        emptytext: '空',
                        showbuttons: 'bottom',
                        url: '/order/return/remark/',
                        rows: 5,
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        },
                        validate: function(value){
                            if(value != '' && $.trim(value) == ''){
                                return '提示：请输入正确的备注信息。'
                            }
                        }
                    });
                };
            });
        },

        // 下一步
        onProcessConfirm: function(event) {
            event.preventDefault(); // prevent navigation
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var current_view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var url = '/order/return/' + $('#order_detail_id').val() + '/confirm/'; // get the contact form url
            $.ajax({
                type: "GET",
                url: url,
                success: function(data){
                    if (data.error_code > 0) {
                        $('#process-confirm').modal('hide');
                        $('#confirm-error-message').text(data.error_msg);
                        $(".alert").show();
                    }else {
                        window.location.href = '/order/list/';
                    }
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    current_view.options.parentView.trigger('finish_ajax_sync');
                    current_view.in_syncing = false;
                }
            });
            return false; // prevent the click propagation
        },

        // 下一步
        onCancelConfirm: function(event) {
            event.preventDefault(); // prevent navigation
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var current_view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var url = '/order/return/' + $('#order_detail_id').val() + '/cancel/'; // get the contact form url
            $.ajax({
                type: "GET",
                url: url,
                success: function(data){
                    if (data.error_code > 0) {
                        $('#cancel-confirm').modal('hide');
                        $('#confirm-error-message').text(data.error_msg);
                        $(".alert").show();
                    }else {
                        window.location.href = '/order/list/';
                    }
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    current_view.options.parentView.trigger('finish_ajax_sync');
                    current_view.in_syncing = false;
                }
            });
            return false; // prevent the click propagation
        },

        // 返回用户一览
        return_to_prev_page:function() {
            var ru = $('#redirect_url');
            var url;
            if (!ru || ru.length === 0 || !ru.val()) {
                url = '/order/list/';
            }else {
                url = ru.val();
            }
            window.location.href = url;
        }
    });
    return AppView;
});