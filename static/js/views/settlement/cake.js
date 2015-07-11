define([
    'require',
    'jquery',
    'backbone',
    'datepicker',
    'datetimepicker',
    'datetimepickerCN'
], function (require, $, Backbone) {
    "use strict";

    return Backbone.View.extend({
        el: "body",
        in_syncing: false,  //防止两重提交标志位

        // 一览分页使用 开始--------------------------
        queryString:{
            'from':parseInt($('#qs_from').val(), 10),
            'limit':parseInt($('#qs_limit').val(), 10),
            'to':parseInt($('#qs_to').val(), 10),
            'sss':$('#qs_sss').val(),
            'eee':$('#qs_eee').val(),
            'order_direction':$('#qs_order_direction').val(),
            'order_field':$('#qs_order_field').val()
        },
        total_count:parseInt($('#total_count').val(), 10),
        url:'/settlement/cake/?',
        btnNextPage:$('#btnNextPage'),
        btnPrevPage:$('#btnPrevPage'),
        lblPageCounter:$('#lblPageCounter'),
        //一览分页使用 结束--------------------------

        // 定义事件
        events:{
            'show .collapse': 'showOrderDetail', // 展现订单详细信息
            'click .data_column':'sortColumn', // 排序
            'click #btnGoGo':'settlement',
            'click #allCity': 'allCity',
            'click #shanghaiCity': 'shanghaiCity',
            'click #beijingCity': 'beijingCity'
        },

        initialize:function() {
            this.initPaginationStatus();
            this.initColumnOrderStatus();
            this.initSubStatus();

            $('#id_start_date').datepicker().on('changeDate', function(event) {
                $(event.target).datepicker('hide');
            });
            $('#id_end_date').datepicker().on('changeDate', function(event) {
                $(event.target).datepicker('hide');
            });
        },
        initSubStatus:function () {
            var subStatus = $('#qs_status').val().trim();
            if (subStatus === '110100') {
                $('#beijingCity').addClass('btn-inverse');
            } else if (subStatus === '310100'){
                $('#shanghaiCity').addClass('btn-inverse');
            } else {
                $('#allCity').addClass('btn-inverse');
            }
        },

        //显示所有城市的蛋糕汇总信息
        allCity:function(){
            var url = this.url;
            url = url + 's=-';
            if (this.queryString.sss) {
                url = url + '&sss=' + encodeURIComponent(this.queryString.sss);
            }
            if (this.queryString.sss) {
                url = url + '&eee=' + encodeURIComponent(this.queryString.eee);
            }
            window.location.href = url;
        },

        //显示上海城市的蛋糕汇总信息
        shanghaiCity:function(){
            var url = this.url;
            url = url + 's=310100';
            if (this.queryString.sss) {
                url = url + '&sss=' + encodeURIComponent(this.queryString.sss);
            }
            if (this.queryString.sss) {
                url = url + '&eee=' + encodeURIComponent(this.queryString.eee);
            }
            window.location.href = url;
        },

        //显示北京城市的蛋糕汇总信息
        beijingCity:function(){
           var url = this.url;
            url = url + 's=110100';
            if (this.queryString.sss) {
                url = url + '&sss=' + encodeURIComponent(this.queryString.sss);
            }
            if (this.queryString.sss) {
                url = url + '&eee=' + encodeURIComponent(this.queryString.eee);
            }
            window.location.href = url;
        },

        // 展现详细信息
        showOrderDetail: function(event) {
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
                success: function (data) {
                    if (data.error_code > 0) {
                        window.alert(data.error_msg);
                    } else {
                        current_target.html(data);
                        $('.tip').tooltip();
                    }
                },
                error: function () {
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function () {
                    //防止两重提交
                    //恢复现场
                    current_view.options.parentView.trigger('finish_ajax_sync');
                    current_view.in_syncing = false;
                }
            });
            return true;
        },

        settlement: function () {
            var sss = $('#sss').val(),
                eee = $('#eee').val(),
                url = this.url;
            if (sss != '' & eee != '' & sss <= eee) {
                url = url + 'sss=' + encodeURIComponent(sss);
                url = url + '&eee=' + encodeURIComponent(eee);
                var searchStatus = $('#qs_status').val();
                url = url + '&s=' + encodeURIComponent(searchStatus);
                window.location.href = url;
            }else{
                if (sss > eee){
                    $('#hidden_end_time_message').removeClass('hidden')
                };
            }
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

        // 列排序
        sortColumn:function (event) {
            var url = this.url;
            url = url + 'sss=' + encodeURIComponent(this.queryString.sss);
            url = url + '&eee=' + encodeURIComponent(this.queryString.eee);
            url = url + '&lm=' + encodeURIComponent(this.queryString.limit);
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
            var searchStatus = $('#id_search_status').val();
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
                //初始化时间段参数
                url = url + 'sss=' + encodeURIComponent(this.queryString.sss);
                url = url + '&eee=' + encodeURIComponent(this.queryString.eee);
                url = url + '&lm=' + encodeURIComponent(this.queryString.limit);
                if (fr > 0) {
                    url = url + '&fr=' + encodeURIComponent(String(fr));
                }
                if (this.queryString.order_field) {
                    url = url + '&of=' + encodeURIComponent(this.queryString.order_field);
                    if (this.queryString.order_direction === '-') {
                        url = url + '&od=-';
                    }
                }
                var searchStatus = $('#qs_status').val().trim();
                url = url + '&s=' + encodeURIComponent(searchStatus);
                this.btnPrevPage.find('a').prop('href', url);
            }

            //次页
            if (this.queryString.from + this.queryString.limit >= this.total_count) {
                this.btnNextPage.addClass('disabled');
            } else {
                fr = this.queryString.from + this.queryString.limit;
                url = this.url;
                //初始化时间段参数
                url = url + 'sss=' + encodeURIComponent(this.queryString.sss);
                url = url + '&eee=' + encodeURIComponent(this.queryString.eee);
                url = url + '&fr=' + encodeURIComponent(fr);
                url = url + '&lm=' + encodeURIComponent(this.queryString.limit);
                if (this.queryString.order_field) {
                    url = url + '&of=' + encodeURIComponent(this.queryString.order_field);
                    if (this.queryString.order_direction === '-') {
                        url = url + '&od=-';
                    }
                }
                var searchStatus = $('#qs_status').val().trim();
                url = url + '&s=' + encodeURIComponent(searchStatus);
                this.btnNextPage.find('a').prop('href', url);
            }

            // 页面
            var page_number = Math.ceil(this.total_count / this.queryString.limit);
            var current_page = this.queryString.from / this.queryString.limit + 1;
            this.lblPageCounter.text(current_page + "/" + page_number + "页");
        }

    });
});