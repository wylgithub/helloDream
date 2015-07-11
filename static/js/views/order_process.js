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
                content: "对于客服人员来说，确定操作是一个不可逆操作，请再次确认您的操作信息，以免出现误操作。"
            });

            $(document).ready(function() {
                var sources = {
                    1: [{value: 61, text: '已出票'}, {value: 71, text: '待配送'}],
                    2: [{value: 62, text: '待退款'}],
                    3: [{value: 61, text: '已出票'}, {value: 62, text: '待退款'}, {value: 71, text: '待配送'}]
                };
                $('.tip').tooltip();
                if($('#excluded_error').val() == 1){
                    $('[name="data-type"]').editable({
                        disabled: true
                    });
                }else{
                    $('.tip').tooltip();
                    // 商品状态初期化
                    $('.goods_status').editable({
                        emptytext: '空',
                        source: [
                            {value: 0, text: '有效'},
                            {value: 1, text: '无效'},
                            {value: 9, text: '删除'}
                        ],
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        }
                    });
                    // 出票方式初期化
                    $('.issue_type').editable({
                        emptytext: '空',
                        source: [
                            {value: 0, text: '直接出票'},
                            {value: 1, text: '代理出票'}
                        ],
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }else {
                                for(var key in data) {
                                    $(".issue_type[data-detail-id='" + key + "']").editable("setValue", data[key]);
                                }
                            }
                        },
                        error: function(){
                            return '与服务器通讯发生错误，请稍后重试。';
                        }
                    });
                    // 锁票初期化
                    $('.hold').editable({
                        emptytext: '空',
                        success: function(data){
                            if (data.error_code > 0) {
                                return data.error_msg;
                            }else {
                                $(".hold[data-pk='" + data.order_detail_id + "']").parent().next().text(data.real_price);
                                $(".hold[data-pk='" + data.order_detail_id + "']").parent().next().next().text(data.status);
                                if (data.process_id > 0) {
                                    $('.process').editable('setValue', '');
                                    $('.process').editable('option', 'source', sources[data.process_id]);
                                }
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
                    // 处理初期化
                    if ($('#process_id').val() > 0) {
                        $('.process').editable({
                            emptytext: '空',
                            source: sources[$('#process_id').val()],
                            success: function(data){
                                if (data.error_code > 0) {
                                    return data.error_msg;
                                }
                            },
                            error: function(){
                                return '与服务器通讯发生错误，请稍后重试。';
                            },
                            validate: function(value){
                                if (value != ''){
                                    if ($('#process_id').val() == 2 || $('#process_id').val() == 3) {
                                        if ($('#remark').editable('getValue', true)['remark'] == '') {
                                            return '提示：请先在左边【反馈】记录与客户沟通的结果，再进行处理。';
                                        }
                                    }
                                }
                            }
                        });
                    }else{
                        $('.process').editable({
                            emptytext: '空',
                            sourceError: '请先确认各详细订单的票务状态，再进行后续操作。'
                        });
                    };
                    // 备注初期化
                    $('#remark').editable({
                        emptytext: '空',
                        showbuttons: 'bottom',
                        url: '/order/feedback/',
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
            var url = '/order/' + $('#order_id').val() + '/detail/confirm/'; // get the contact form url
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