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

        // 一览分页使用 开始--------------------------
        queryString: {
            'from': parseInt($('#qs_from').val(), 10),
            'limit': parseInt($('#qs_limit').val(), 10),
            'to': parseInt($('#qs_to').val(), 10),
            'order_direction': $('#qs_order_direction').val(),
            'order_field': $('#qs_order_field').val()
        },
        total_count: parseInt($('#total_count').val(), 10),
        url: '/user/list/?',
        btnNextPage: $('#btnNextPage'),
        btnPrevPage: $('#btnPrevPage'),
        lblPageCounter: $('#lblPageCounter'),
        //一览分页使用 结束--------------------------

        // 事件定义
        events: {
            'click .data_column': 'sortColumn', // 排序
            'click #btnSearch': 'search', //根据关键字搜索排序
            'show .collapse': 'showUserDetail' // 展现用户详细信息
        },

        // 初始化
        initialize: function () {
            this.initPaginationStatus();
            this.initColumnOrderStatus();

            $(document).ready(function() {

                // 重置密码
                $('.password_reset').editable({
                    emptytext: '重置',
                    url: '/user/password/reset/',
                    success: function(data){
                        if (data.error_code > 0) {
                            return data.error_msg;
                        }else{
                            return data;
                        }
                    },
                    error: function(){
                        return '与服务器通讯发生错误，请稍后重试。';
                    },
                    validate: function(data){
                        if(data.length < 6){
                            return '提示：请输入一个6位以上的密码。';
                        }
                        if(data.length > 22){
                            return '提示：请输入一个22位以下的密码。';
                        }
                    }
                });

                // 重置手机
                $('.mobile_reset').editable({
                    emptytext: '空',
                    url: '/user/mobile/reset/',
                    success: function(data){
                        if (data.error_code > 0) {
                            return data.error_msg;
                        }else{
                            return data;
                        }
                    },
                    error: function(){
                        return '与服务器通讯发生错误，请稍后重试。';
                    },
                    validate: function(data){
                        var pattern = /^\d{11}$/;
                        if (!data.match(pattern)) {
                            return '提示：请输入一个有效手机号码。';
                        }
                    }
                });

                // 重置邮箱
                $('.email_reset').editable({
                    emptytext: '空',
                    url: '/user/email/reset/',
                    success: function(data){
                        if (data.error_code > 0) {
                            return data.error_msg;
                        }else{
                            return data;
                        }
                    },
                    error: function(){
                        return '与服务器通讯发生错误，请稍后重试。';
                    },
                    validate: function(data){
                        var pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        if (!data.match(pattern)) {
                            return '提示：请输入一个有效邮箱。';
                        }
                    }
                });
            });
        },

        // 排序列状态初始化
        initColumnOrderStatus: function () {
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
        search: function () {
            var queryKey = $.trim($('#queryKey').val()),
                url = this.url;
            url = url + 'lm=' + encodeURIComponent(this.queryString.limit);
            if (this.queryString.order_field) {
                url = url + '&of=' + encodeURIComponent(this.queryString.order_field);
                if (this.queryString.order_direction === '-') {
                    url = url + '&od=-';
                }
            }
            url = url + '&q=' + encodeURIComponent(queryKey);
            window.location.href = url;
        },

        // 列排序
        sortColumn: function (event) {
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
        initPaginationStatus: function () {
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
                url = url + '&q=' + encodeURIComponent(queryKey);
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
                url = url + '&q=' + encodeURIComponent(queryKey);
                this.btnNextPage.find('a').prop('href', url);
            }

            // 页面
            var page_number = Math.ceil(this.total_count / this.queryString.limit);
            var current_page = this.queryString.from / this.queryString.limit + 1;
            this.lblPageCounter.text(current_page + "/" + page_number + "页");
        },

        // 展现详细信息
        showUserDetail: function(event){
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
        }
    });
    return AppView;
});