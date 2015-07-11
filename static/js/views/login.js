define([
    'require',
    'jquery',
    'backbone',
    'cookie'
], function (require, $, Backbone) {
    "use strict";

    var AppView = Backbone.View.extend({
        el:"body",
        in_syncing:false,  //防止两重提交标志位

        events:{
            'click #btnLogin':'login',
            'click #maintainClose': 'setNoticeExpireCookie'
        },

        initialize:function() {
            //初始化时根据cookie显示网站升级通知条
            if($.cookie("maintain_notice_closed")){
                $('#maintain_notice_bar').hide();
            }
            else{
                $('#maintain_notice_bar').show();
            }
        },

        login:function() {
            if (this.in_syncing) {
                return;
            }
            //防止两重提交
            this.in_syncing = true;
            $('#btnLogin').prop('disabled', true);

            $('#frmLogin').submit();
        },

        //设置首页展示条过期时间cookie
        setNoticeExpireCookie:function() {
            var date = new Date();
            //设置一小时的过期时间，用户点击后一小时内不再显示维护通知条
            date.setTime(date.getTime() + (60 * 60 * 1000));
            $.cookie("maintain_notice_closed", "1",{expires:date,path: '/',domain:'piaoshifu.cn'});
        }
    });
    return AppView;
});