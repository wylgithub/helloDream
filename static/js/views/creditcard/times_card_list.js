define([
    'require',
    'jquery',
    'backbone',
    'editable'
], function (require, $, Backbone) {
    "use strict";

    return Backbone.View.extend({
        el:"body",
        in_syncing:false,  //防止两重提交标志位
        btnDelete:$('#btnDelete'),

        // 一览分页使用 开始--------------------------
        queryString:{
            'from':parseInt($('#qs_from').val(), 10),
            'limit':parseInt($('#qs_limit').val(), 10),
            'to':parseInt($('#qs_to').val(), 10),
            'order_direction':$('#qs_order_direction').val(),
            'order_field':$('#qs_order_field').val()
        },
        total_count:parseInt($('#total_count').val(), 10),
        url:'/times_card/times/card/list/?',
        btnNextPage:$('#btnNextPage'),
        btnPrevPage:$('#btnPrevPage'),
        lblPageCounter:$('#lblPageCounter'),
        //一览分页使用 结束--------------------------

        // 事件定义
        events:{
            'click #checkSelectAll':'selectAll',
            'change .list_selector':'selectorChanged',
            'click .data_column':'sortColumn', // 排序
            'click #btnSearch':'search', //根据关键字搜索
            'click #btnDelete':'remove', //删除
            'show .collapse': 'showConsumeOrder' // 展现消费订单信息
        },

        // 初始化
        initialize:function () {
            this.toggleCommandButtonStatus();
            this.initPaginationStatus();
            this.initColumnOrderStatus();

            $(document).ready(function() {
                $('.tip').tooltip();
                // 退款点数退额
                $('.expiry_date').editable({
                    emptytext: '空',
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
                        var pattern = /^(\d{4})\/(\d{2})\/(\d{2})$/;
                        if (!data.match(pattern)) {
                            return '提示：请输入一个有效日期。';
                        }
                    }
                });
            });
        },

        // 排序列状态初始化
        initColumnOrderStatus:function() {
            // 初始化排序列的表头
            var logo_css;
            if (this.queryString.order_direction === '-') {
                logo_css = 'icon-arrow-down';
            }else {
                logo_css = 'icon-arrow-up';
            }
            $('.data_column[sort_key=' + this.queryString.order_field + ']').append('<li class="' + logo_css + '"></li>');

        },

        // 搜索
        search:function() {
            var queryKey = $('#queryKey').val();
            queryKey = $.trim(queryKey);
            var url = this.url;
            url = url + 'lm=' + encodeURIComponent(this.queryString.limit);
            url = url + '&fr=' + encodeURIComponent(this.queryString.from);
            if (this.queryString.order_field) {
                url = url + '&of=' + encodeURIComponent(this.queryString.order_field);
                if (this.queryString.order_direction === '-') {
                    url = url + '&od=-';
                }
            }
            url = url + '&q=' + encodeURIComponent(queryKey);
            window.location.href = url;
        },

        // 删除
        remove:function() {
            //防止两重提交
            if (this.in_syncing) return;
            this.in_syncing = true;
            this.btnDelete.prop('disabled', true);
            this.btnDelete.addClass('disabled');
            this.undelegateEvents();

            var pk = '';
            $('.list_selector:checked').each(function(index, value) {
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
            $('#frmDeleteCreditcard').submit();
        },

        // 选中全部
        selectAll:function() {
            $('.list_selector').prop('checked', $('#checkSelectAll').prop('checked'));
            this.toggleCommandButtonStatus();
        },

        // 选择框变更状态
        selectorChanged:function() {
            this.toggleCommandButtonStatus();
            $('#checkSelectAll').prop('checked', $('.list_selector').length === $('.list_selector:checked').length);
        },

        // 列排序
        sortColumn:function(event) {
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
        initPaginationStatus:function() {
            var url,fr;

            //前页
            if (this.queryString.from <= 0) {
                this.btnPrevPage.addClass('disabled');
            }else {
                fr = this.queryString.from - this.queryString.limit;
                if (fr < 0){
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
            }else {
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

        // 一览前置选择框状态变化使用
        toggleCommandButtonStatus:function() {
            var selectedNum = $('.list_selector:checked').length;
            if (this.btnDelete) {
                this.btnDelete.prop('disabled', selectedNum === 0);
                if (selectedNum !== 0) {
                    this.btnDelete.removeClass('disabled');
                }else {
                    this.btnDelete.addClass('disabled');
                }
            }
        },

        // 展现详细信息
        showConsumeOrder: function(event){
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
});