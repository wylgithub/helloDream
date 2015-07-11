define([
    'require',
    'jquery',
    'backbone',
    'cookie'
], function (require, $, Backbone) {
    "use strict";
    return Backbone.View.extend({
        el: "body",

        events: {
            'click .dropdownItem': 'dropdownItem_click',
            'click #btnSearchOrder': 'btnSearchOrder',
            'click #btnSearchMovieOrder': 'btnSearchMovieOrder',
            'click #btnSearchScenicOrder': 'btnSearchScenicOrder',
            'click #btnSearchDelivery': 'btnSearchDelivery',
            'click #btnSearchRefund': 'btnSearchRefund',
            'click #btnSearchMovieRefund': 'btnSearchMovieRefund',
            'click #btnSearchScenicRefund': 'btnSearchScenicRefund',
            'click #btnSearchActivity': 'btnSearchActivity',
            'click #maintainClose': 'setNoticeExpireCookie'
        },
        initialize:function() {
            //初始化时将网站维护通知条放到最上方
            $('#maintain_notice_bar').insertBefore($("#navbar"));
            if($.cookie("maintain_notice_closed")){
                $('#maintain_notice_bar').hide();
            }
            else{
                $('#maintain_notice_bar').show();
            }
        },

        // 选择
        dropdownItem_click: function (event) {
            var element = $(event.target),
                id = element.attr('for');
            $("#" + id).val(element.attr('value'));
            $("#" + id + '_trigger').text(element.text());
            $("#" + id + '_trigger').append(' <span class="caret"></span>');
        },

        btnSearchOrder: function () {
            var url = '/order/list/',
                search_keyword = $.trim($("#queryKeyOrder").val()),
                search_status = $('#id_order_search_status').val();

            url = url + '?q=' + encodeURIComponent(search_keyword);
            url = url + '&s=' + encodeURIComponent(search_status);
            window.location.href = url;
        },

        btnSearchMovieOrder: function () {
            var url = '/order/movie/list/',
                search_keyword = $.trim($("#queryKeyMovieOrder").val()),
                search_status = $('#id_movie_order_search_status').val();

            url = url + '?q=' + encodeURIComponent(search_keyword);
            url = url + '&s=' + encodeURIComponent(search_status);
            window.location.href = url;
        },

        btnSearchScenicOrder: function () {
            var url = '/order/scenic/list/',
                search_keyword = $.trim($("#queryKeyScenicOrder").val()),
                search_status = $('#id_scenic_order_search_status').val();

            url = url + '?q=' + encodeURIComponent(search_keyword);
            url = url + '&s=' + encodeURIComponent(search_status);
            window.location.href = url;
        },

        btnSearchDelivery: function () {
            var url = '/order/delivery/list/',
                search_keyword = $.trim($("#queryKeyDelivery").val());
            if (search_keyword === '') {
                return;
            }

            url = url + '?q=' + encodeURIComponent(search_keyword);
            window.location.href = url;
        },

        btnSearchRefund: function () {
            var url = '/order/refund/list/',
                search_keyword = $.trim($("#queryKeyRefund").val());
            if (search_keyword === '') {
                return;
            }

            url = url + '?q=' + encodeURIComponent(search_keyword);
            window.location.href = url;
        },

        btnSearchMovieRefund: function () {
            var url = '/order/movie/refund/list/',
                search_keyword = $.trim($("#queryKeyMovieRefund").val());
            if (search_keyword === '') {
                return;
            }

            url = url + '?q=' + encodeURIComponent(search_keyword);
            window.location.href = url;
        },

        btnSearchScenicRefund: function () {
            var url = '/order/scenic/refund/list/',
                search_keyword = $.trim($("#queryKeyScenicRefund").val());
            if (search_keyword === '') {
                return;
            }

            url = url + '?q=' + encodeURIComponent(search_keyword);
            window.location.href = url;
        },

        btnSearchActivity: function () {
            var url = '/activity/',
                search_keyword = $.trim($("#queryKeyActivity").val()),
                search_kind = $('#id_activity_search_kind').val();

            if (search_kind === '5') {
                url = url + 'movie/list/';
            } else {
                url = url + search_kind + '/list/';
            }
            url = url + '?q=' + encodeURIComponent(search_keyword);
            window.location.href = url;
        },

        //设置首页展示条过期时间cookie
        setNoticeExpireCookie:function() {
            var date = new Date();
            //设置一小时的过期时间，用户点击后一小时内不再显示维护通知条
            date.setTime(date.getTime() + (60 * 60 * 1000));
            $.cookie("maintain_notice_closed", "1",{expires:date,path: '/',domain:'piaoshifu.cn'});
        }
    });
});