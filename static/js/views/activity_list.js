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
        btnDelete: $('#btnDelete'),
        btnFetch: $('#btnFetch'),

        // 一览分页使用 开始--------------------------
        queryString: {
            'from': parseInt($('#qs_from').val(), 10),
            'limit': parseInt($('#qs_limit').val(), 10),
            'to': parseInt($('#qs_to').val(), 10),
            'order_direction': $('#qs_order_direction').val(),
            'order_field': $('#qs_order_field').val()
        },
        total_count: parseInt($('#total_count').val(), 10),
        url: '/activity/' + $('#activity_kind').val() + '/list/?',
        btnNextPage: $('#btnNextPage'),
        btnPrevPage: $('#btnPrevPage'),
        lblPageCounter: $('#lblPageCounter'),
        //一览分页使用 结束--------------------------

        // 事件定义
        events: {
            'click .dropdownItem': 'dropdownItem_click',
            'click #checkSelectAll': 'selectAll',
            'change .list_selector': 'selectorChanged',
            'click .data_column': 'sortColumn', // 排序
            'click #btnSearch': 'search', //根据关键字搜索排序
            'click #btnFetch': 'fetch', //取入
            'click #btnDelete': 'remove_click' //删除
        },

        // 初始化
        initialize: function () {
            this.toggleCommandButtonStatus();
            this.initPaginationStatus();
            this.initColumnOrderStatus();

            $(document).ready(function () {
                $('.tip').tooltip();
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

        // 搜索
        search: function () {
            var queryKey = $.trim($('#queryKey').val()),
                searchStatus = $('#id_search_status').val(),
                url = this.url;
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

        // 取入
        fetch: function () {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            this.btnFetch.prop('disabled', true);
            this.btnFetch.addClass('disabled');
            window.location.href = '/activity/' + $('#activity_kind').val() + '/fetch/';
        },

        // 删除数据
        remove_click: function () {
            var pk = '',
                url = this.url,
                queryKey = $.trim($('#queryKey').val()),
                searchStatus = $('#id_search_status').val();

            //防止两重提交
            if (this.in_syncing) {
                return;
            }

            if (!window.confirm("警告，删除活动将会删除其生成的所有商品，请确认是否继续？")) {
                return;
            }

            this.in_syncing = true;
            this.btnDelete.prop('disabled', true);
            this.btnDelete.addClass('disabled');
            this.undelegateEvents();

            $('.list_selector:checked').each(function (index, value) {
                pk = pk + $(value).attr('pk') + ',';
            });
            $('#pk').val(pk);

            url = url + 'lm=' + encodeURIComponent(this.queryString.limit);
            url = url + '&fr=' + encodeURIComponent(this.queryString.from);
            if (this.queryString.order_field) {
                url = url + '&of=' + encodeURIComponent(this.queryString.order_field);
                if (this.queryString.order_direction === '-') {
                    url = url + '&od=-';
                }
            }
            url = url + '&q=' + encodeURIComponent(queryKey);
            url = url + '&s=' + encodeURIComponent(searchStatus);
            $('#redirect_url').val(url);
            $('#frmActivityList').attr('action', '/activity/' + $('#activity_kind').val() + '/delete/action/').submit();
        },

        // 选中全部
        selectAll: function () {
            $('.list_selector').prop('checked', $('#checkSelectAll').prop('checked'));
            this.toggleCommandButtonStatus();
        },

        // 选择框变更状态
        selectorChanged: function () {
            this.toggleCommandButtonStatus();
            $('#checkSelectAll').prop('checked', $('.list_selector').length === $('.list_selector:checked').length);
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
            var searchStatus = $('#id_search_status').val();
            url = url + '&q=' + encodeURIComponent(queryKey);
            url = url + '&s=' + encodeURIComponent(searchStatus);
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
        },

        // 一览前置选择框状态变化使用
        toggleCommandButtonStatus: function () {
            if (this.btnDelete) {
                var selectedNumToBeDeleted = $('.list_selector:checked').length;
                this.btnDelete.prop('disabled', selectedNumToBeDeleted === 0);
                if (selectedNumToBeDeleted !== 0) {
                    this.btnDelete.removeClass('disabled');
                } else {
                    this.btnDelete.addClass('disabled');
                }
            }
        }
    });
    return AppView;
});