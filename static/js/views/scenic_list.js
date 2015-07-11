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
            'status': parseInt($('#qs_status').val(), 10),
            'from': parseInt($('#qs_from').val(), 10),
            'limit': parseInt($('#qs_limit').val(), 10),
            'to': parseInt($('#qs_to').val(), 10),
            'order_direction': $('#qs_order_direction').val(),
            'order_field': $('#qs_order_field').val()
        },
        total_count: parseInt($('#total_count').val(), 10),
        url: '/misc/scenic/list/?',
        btnNextPage: $('#btnNextPage'),
        btnPrevPage: $('#btnPrevPage'),
        lblPageCounter: $('#lblPageCounter'),
        //一览分页使用 结束--------------------------

        // 事件定义
        events: {
            'keydown #queryKey':'keyDownOnSearchInput',
            'click .dropdownItem':'dropdownItem_click',
            'click .data_column': 'sortColumn', // 排序
            'click #btnSearch': 'search' //根据关键字搜索排序
        },

        // 初始化
        initialize: function () {
            this.initPaginationStatus();
            this.initColumnOrderStatus();

            $(document).ready(function() {
                //修改景点所属城市
                $(".quick_change_belong_city").editable({
                    emptytext: '空',
                    url: '/misc/scenic/change/city/',
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
                        var pattern = /^\d+$/;
                        if (!data.match(pattern)) {
                            return '提示：请选择一个城市。';
                        }
                    }
                });

                //修改景点状态
                $(".quick_change_mapping_flag").editable({
                    url: '/misc/scenic/change/flag/',
                    source:{"0": "无效", "1": "有效", "2": "待定"},
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
                        var pattern = /^\d$/;
                        if (!data.match(pattern)) {
                            return '提示：请选择一种状态。';
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

        // 选择
        dropdownItem_click: function (event) {
            var element = $(event.target),
                id = element.attr('for');
            $("#" + id).val(element.attr('value'));
            $("#" + id + '_trigger').text(element.text());
            $("#" + id + '_trigger').append(' <span class="caret"></span>');
        },

        // 输入框回车
        keyDownOnSearchInput: function(event){
            if (event.keyCode === 13) {
                event.preventDefault();
                $('#btnSearch').click();
            }
        },

        // 搜索
        search: function () {
            var queryKey = $.trim($('#queryKey').val()),
                searchStatus = $('#id_search_status').val(),
                url = this.url;
            url = url + 'lm=' + encodeURIComponent(this.queryString.limit);
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
        sortColumn: function (event) {
            var url = this.url;
            url = url + 's=' + encodeURIComponent(this.queryString.status);
            url = url + '&fr=' + encodeURIComponent(this.queryString.from);
            url = url + '&lm=' + encodeURIComponent(this.queryString.limit);
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