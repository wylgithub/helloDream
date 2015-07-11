define([
    'require',
    'jquery',
    'backbone',
    'editable'
], function (require, $, Backbone) {
    "use strict";

    var AppView;
    AppView = Backbone.View.extend({
        el: "body",
        in_syncing: false, //防止两重提交标志位
        order_id: "", // 订单id
        btnDelivery: $('#btnDelivery'),

        // 一览分页使用 开始--------------------------
        queryString: {
            'from': parseInt($('#qs_from').val(), 10),
            'limit': parseInt($('#qs_limit').val(), 10),
            'to': parseInt($('#qs_to').val(), 10),
            'order_direction': $('#qs_order_direction').val(),
            'order_field': $('#qs_order_field').val()
        },
        total_count: parseInt($('#total_count').val(), 10),
        url: '/order/delivery/list/?',
        btnNextPage: $('#btnNextPage'),
        btnPrevPage: $('#btnPrevPage'),
        lblPageCounter: $('#lblPageCounter'),
        //一览分页使用 结束--------------------------

        // 事件定义
        events: {
            'click #checkSelectAll': 'selectAll',
            'change .list_selector': 'selectorChanged',
            'click .data_column': 'sortColumn', // 排序
            'click #btnSearch': 'search', //根据关键字搜索排序
            'show .collapse': 'showOrderDetail', // 展现订单详细信息
            'click .btn-delivery-confirm': 'onDeliveryConfirm'  // 订单配送处理
        },

        // 初始化
        initialize:function () {
            this.toggleCommandButtonStatus();
            this.initPaginationStatus();
            this.initColumnOrderStatus();

            $(document).ready(function() {
                // 显示tooltip
                $('.tip').tooltip();
                // 配送快递平台
                $('.delivery_express_kind').editable({
                    emptytext: '空',
                    source: [
                        {value: 10, text: '顺丰'},
                        {value: 20, text: '圆通'},
                        {value: 30, text: '申通'},
                        {value: 40, text: '汇通'},
                        {value: 50, text: '韵达'},
                        {value: 60, text: '优速'}
                    ],
                    success: function(data, newValue){
                        if (data.error_code > 0) {
                            return data.error_msg;
                        }
                    },
                    error: function(){
                        return '与服务器通讯发生错误，请稍后重试。';
                    },
                    validate: function(data){
//                        if(data == '' || data < 0){
//                            return '提示：请输入一个正整数。'
//                        }
                    }
                });
                // 配送快递单号
                $('.delivery_express_no').editable({
                    emptytext: '空',
                    success: function(data, newValue){
                        if (data.error_code > 0) {
                            return data.error_msg;
                        }else{
                            if($.trim(newValue) != ''){
                                $(this).parent().prev().prev().prev().prev().children().prop('disabled', false);;
                            }else{
                                $(this).parent().prev().prev().prev().prev().children().prop('disabled', true);;
                            }
                        }
                    },
                    error: function(){
                        return '与服务器通讯发生错误，请稍后重试。';
                    },
                    validate: function(data){
                        if(data != '' && $.trim(data) == ''){
                            return '提示：请输入正确的配送快递单号。'
                        }else{
                            if($(this).parent().prev().children().editable('getValue', true)['express_kind'] == ''){
                                return '提示：请先选择配送快递平台。'
                            }
                        }
                    }
                });
                // 配送备注
                $('.delivery_remark').editable({
                    emptytext: '空',
                    showbuttons: 'bottom',
                    url: '/order/delivery/remark/',
                    rows: 2,
                    success: function(data){
                        if (data.error_code > 0) {
                            return data.error_msg;
                        }
                    },
                    error: function(){
                        return '与服务器通讯发生错误，请稍后重试。';
                    }
                });
            });
        },

        // 展现详细信息
        showOrderDetail: function(event){
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var current_view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var current_target = $(event.target);
            var url = $(event.target).data("form"); // get the contact form url
            $.ajax({
                type: "GET",
                url: url,
                success: function(data){
                    if (data.error_code > 0) {
                        window.alert(data.error_msg);
                    }else {
                        current_target.html(data);
                        $('.tip').tooltip();
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
            return true;
        },

        // 排序列状态初始化
        initColumnOrderStatus:function () {
            // 初始化排序列的表头
            var logo_css;
            if (this.queryString.order_direction === '-') {
                logo_css = 'icon-arrow-down';
            } else {
                logo_css = 'icon-arrow-up';
            }
            $('.data_column[sort_key=' + this.queryString.order_field + ']').append('<li class="' + logo_css + '"></li>');

        },

        // 搜索
        search:function () {
            var queryKey = $('#queryKey').val();
            queryKey = $.trim(queryKey);
            var url = this.url;
            url = url + 'lm=' + encodeURIComponent(this.queryString.limit);
//            url = url + '&fr=' + encodeURIComponent(this.queryString.from);
            if (this.queryString.order_field) {
                url = url + '&of=' + encodeURIComponent(this.queryString.order_field);
                if (this.queryString.order_direction === '-') {
                    url = url + '&od=-';
                }
            }
            url = url + '&q=' + encodeURIComponent(queryKey);
            window.location.href = url;
        },

        // 订单配送处理
        onDeliveryConfirm:function () {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }

            this.in_syncing = true;
            this.btnDelivery.prop('disabled', true);
            this.btnDelivery.addClass('disabled');
            this.undelegateEvents();

            var pk = '';
            $('.list_selector:checked').each(function (index, value) {
                pk = pk + $(value).attr('pk') + ',';
            });
            $('#pk').val(pk);

            var url = this.url;
            url = url + 'lm=' + encodeURIComponent(this.queryString.limit);
            url = url + '&fr=' + encodeURIComponent(this.queryString.from);
            if (this.queryString.order_field) {
                url = url + '&of=' + encodeURIComponent(this.queryString.order_field);
                if (this.queryString.order_direction === '-') {
                    url = url + '&od=-';
                }
            }
            $('#redirect_url').val(url);
            $('#frmOrderDeliveryList').attr('action', '/order/delivery/').submit();
        },

        // 选中全部
        selectAll:function () {
            $('.list_selector').each(function (index, value) {
                if(!$(value).prop('disabled')){
                    $(value).prop('checked', $('#checkSelectAll').prop('checked'));
                }
            });
            this.toggleCommandButtonStatus();
        },

        // 选择框变更状态
        selectorChanged:function () {
            this.toggleCommandButtonStatus();
            $('#checkSelectAll').prop('checked', $('.list_selector').length === $('.list_selector:checked').length);
        },

        // 列排序
        sortColumn:function (event) {
            var url = this.url;
            url = url + 'lm=' + encodeURIComponent(this.queryString.limit);
            url = url + '&fr=' + encodeURIComponent(this.queryString.from);
            var od = '-';
            if (this.queryString.order_direction === '-') {
                od = '';
            }
            var of = $(event.target).attr('sort_key');

            if (of) {
                url = url + '&of=' + encodeURIComponent(of);
                if (od === '-') {
                    url = url + '&od=-';
                }
            }
            var queryKey = $('#queryKey').val();
            queryKey = $.trim(queryKey);
            url = url + '&q=' + encodeURIComponent(queryKey);
            window.location.href = url;
        },

        // 一览分页元素初始化使用
        initPaginationStatus:function () {
            var url, fr;

            //前页
            if (this.queryString.from <= 0) {
                this.btnPrevPage.addClass('disabled');
            } else {
                fr = this.queryString.from - this.queryString.limit;
                if (fr < 0) {
                    fr = 0;
                }
                url = this.url;
                url = url + 'lm=' + encodeURIComponent(this.queryString.limit);
                if (fr > 0) {
                    url = url + '&fr=' + encodeURIComponent(String(fr));
                }
                if (this.queryString.order_field) {
                    url = url + '&of=' + encodeURIComponent(this.queryString.order_field);
                    if (this.queryString.order_direction === '-') {
                        url = url + '&od=-';
                    }
                }
                this.btnPrevPage.find('a').prop('href', url);
            }

            //次页
            if (this.queryString.from + this.queryString.limit >= this.total_count) {
                this.btnNextPage.addClass('disabled');
            } else {
                fr = this.queryString.from + this.queryString.limit;
                url = this.url;
                url = url + 'fr=' + encodeURIComponent(fr);
                url = url + '&lm=' + encodeURIComponent(this.queryString.limit);
                if (this.queryString.order_field) {
                    url = url + '&of=' + encodeURIComponent(this.queryString.order_field);
                    if (this.queryString.order_direction === '-') {
                        url = url + '&od=-';
                    }
                }
                this.btnNextPage.find('a').prop('href', url);
            }

            // 页面
            var page_number = Math.ceil(this.total_count / this.queryString.limit);
            var current_page = this.queryString.from / this.queryString.limit + 1;
            this.lblPageCounter.text(current_page + "/" + page_number + "页");
        },

        // 一览前置选择框状态变化使用
        toggleCommandButtonStatus:function () {
            if (this.btnDelivery) {
                var selected = $('.list_selector:checked').length;
                this.btnDelivery.prop('disabled', selected === 0);
                if (selected !== 0) {
                    this.btnDelivery.removeClass('disabled');
                } else {
                    this.btnDelivery.addClass('disabled');
                }
            }
        }
    });
    return AppView;
});