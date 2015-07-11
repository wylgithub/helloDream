define([
    'require',
    'jquery',
    'backbone'
], function (require, $, Backbone) {
    "use strict";

    var AppView;
    AppView = Backbone.View.extend({
        el:"body",
        in_syncing:false, //防止两重提交标志位
        order_id: "", // 订单id

        // 一览分页使用 开始--------------------------
        queryString:{
            'from':parseInt($('#qs_from').val(), 10),
            'limit':parseInt($('#qs_limit').val(), 10),
            'to':parseInt($('#qs_to').val(), 10),
            'order_direction':$('#qs_order_direction').val(),
            'order_field':$('#qs_order_field').val()
        },
        total_count:parseInt($('#total_count').val(), 10),
        url:'/order/list/?',
        btnNextPage:$('#btnNextPage'),
        btnPrevPage:$('#btnPrevPage'),
        lblPageCounter:$('#lblPageCounter'),
        //一览分页使用 结束--------------------------

        // 事件定义
        events:{
            'click .dropdownItem':'dropdownItem_click',
            'click .data_column':'sortColumn', // 排序
            'click #btnSearch':'search', //根据关键字搜索排序
            'show .collapse': 'showOrderDetail', // 展现订单详细信息
            'click .btn-cancel': 'onCancelClick',
            'click .btn-cancel-confirm': 'onCancelConfirm',
            'click .btn-reset': 'onResetClick',
            'click .btn-reset-confirm': 'onResetConfirm'
        },

        // 初始化
        initialize:function () {
            this.initPaginationStatus();
            this.initColumnOrderStatus();

            $(document).ready(function() {
                $('.tip').tooltip();
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

        // 订单取消点击
        onCancelClick: function(event){
            this.order_id = event.target.attributes['data-order-id'].value;
        },

        // 订单取消处理
        onCancelConfirm: function(){
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            window.location.href = '/order/' + this.order_id + '/cancel/';
        },

        // 订单重置点击
        onResetClick: function(event){
            this.order_id = event.target.attributes['data-order-id'].value;
        },

        // 订单重置处理
        onResetConfirm: function(){
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            window.location.href = '/order/' + this.order_id + '/reset/';
        },

        // 选择
        dropdownItem_click:function(event) {
            var element = $(event.target);
            var id = element.attr('for');
            $("#" + id).val(element.attr('value'));
            $("#" + id + '_trigger').text(element.text());
            $("#" + id + '_trigger').append(' <span class="caret"></span>');
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
            var searchStatus = $('#id_search_status').val();
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
            url = url + '&s=' + encodeURIComponent(searchStatus);
            window.location.href = url;
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
            var searchStatus = $('#id_search_status').val();
            url = url + '&q=' + encodeURIComponent(queryKey);
            url = url + '&s=' + encodeURIComponent(searchStatus);
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
                var queryKey = $('#queryKey').val();
                queryKey = $.trim(queryKey);
                var searchStatus = $('#id_search_status').val();
                url = url + '&q=' + encodeURIComponent(queryKey);
                url = url + '&s=' + encodeURIComponent(searchStatus);
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
                var queryKey = $('#queryKey').val();
                queryKey = $.trim(queryKey);
                var searchStatus = $('#id_search_status').val();
                url = url + '&q=' + encodeURIComponent(queryKey);
                url = url + '&s=' + encodeURIComponent(searchStatus);
                this.btnNextPage.find('a').prop('href', url);
            }

            // 页面
            var page_number = Math.ceil(this.total_count / this.queryString.limit);
            var current_page = this.queryString.from / this.queryString.limit + 1;
            this.lblPageCounter.text(current_page + "/" + page_number + "页");
        }
    });
    return AppView;
});