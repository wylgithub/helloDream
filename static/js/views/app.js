define([
    'require',
    'jquery',
    'backbone'
], function (require, $, Backbone) {
    "use strict";

    return Backbone.View.extend({
        el:"body",
        in_ajax_working:false,
        ajax_counter:0,  // ajax活动计数器，为0时才可撤销动画显示，增加这个是考虑到同一页面可能同时有多个异步访问，互相之间会影响效果显示
        _svh:null, // 异步价值js模块使用，就是后面跟着的?v=xxxxx的版本时间戳，用以避免js cache影响。
        _staticURL:null, // 静态文件路径前缀

        // ajax访问开始事件
        start_ajax_sync:function() {
            this.ajax_counter++;

            if (this.in_ajax_working) {
                return;
            }
            this.in_ajax_working = true;
            // 显示ajax logo
            var _view = this;
            this.ajax_logo.fadeIn(function() {
                _view.animateContentView.start();
            });
        },

        // ajax访问结束事件
        finish_ajax_sync:function() {
            this.ajax_counter--;

            if (this.ajax_counter === 0) {
                var _view = this;
                this.ajax_logo.fadeOut(function() {
                    _view.animateContentView.stop();
                }).remove();
                this.in_ajax_working = false;
            }
        },

        // 当前网址加入返回队列
        get_next_link:function() {
            var current_url = window.location.pathname + window.location.search;
            return "next=" + encodeURIComponent(current_url);
        },

        initialize:function() {
            this.url_path = $('#url_path').val();
            var url_path = this.url_path;
            $('[active-by-url]').each(function(){
                var regx = new RegExp($(this).attr('active-by-url'));
                if (url_path.match(regx)) {
                    $(this).addClass('active');
                }
            });

            // 所有的按钮采用bootstrap tooltip，要生效必须设定title
            $('.btn').tooltip({
                delay:{show:200, hide:100}
            });

            // 页面上如果存在default_button，则绑定enter键事件
            $(this.el).live('keydown', function(event){
                if (event.keyCode === 13) {
                    var default_button;
                    var priority = 0;
                    var default_buttons = $('.default_button');
                    for (var i =0; i < default_buttons.length; i++) {
                        var obj = default_buttons[i];
                        if (!default_button) {
                            default_button = obj;
                        }
                        if ($(obj).attr('default_priority')) {
                            var p = parseInt($(obj).attr('default_priority'), 10);
                            if (p > priority) {
                                priority = p;
                                default_button = obj;
                            }
                        }
                    }
                    if (default_button) {
                        $(default_button).trigger('click');
                        return false;
                    }
                }
                return true;
            });

            // 聚焦到第一个控件
            $('.first_focus').focus();
            // 聚焦到出错控件的第一个
            $('.error_flg').first().focus();

            // 初始化ajax logo
            this.ajax_logo = $('<div class="ajax_logo">加载中...</div>').appendTo(this.el);
            var _view = this;
            require([
                this.convertStaticURLWithHash('js/views/animation/animate_content.js')
            ], function(AnimateContentView) {
                _view.animateContentView = new AnimateContentView({
                    container: _view.ajax_logo
                });
            });
            this.on('start_ajax_sync', this.start_ajax_sync);
            this.on('finish_ajax_sync', this.finish_ajax_sync);

            // 限制输入
            $('.numberic_only').on('keydown', function(event) {
                // 只能输入0~9, Enter Delete Tab
                if ((event.keyCode < 48 || event.keyCode > 57) && $.inArray(event.keyCode, [8, 9, 13]) === -1) {
                    event.stopPropagation();
                    return false;
                }
            });

            // 加载其他的脚本
            var appModule = $('#amd_module');
            if (appModule.length > 0) {
                var currentView = this;
                var pageViewUrl = appModule.val();
                pageViewUrl += '?v=' + this.getStaticVersionHash();
                require([pageViewUrl], function(OtherApp) {
                    return new OtherApp({parentView:currentView});
                });
            }
        },

        // 获取版本鉴别哈希值
        getStaticVersionHash:function() {
            // 取得系统版本号
            if (!this._svh) {
                var svhObj = $('#static_version_hash');
                if (svhObj && svhObj.length > 0) {
                    this._svh = svhObj.val();
                }else {
                    this._svh = Math.floor(Math.random() * 10000000) + 1000000;
                }
            }
            return this._svh;
        },

        // 将静态文件路径转换成本番环境真实配置，并且带版本鉴别哈希值
        // @param url 相对的静态文件资源
        convertStaticURLWithHash:function(url) {
            // 取得静态文件路径
            if (!this._staticURL) {
                var staticURL = $('#static_url');
                if (staticURL && staticURL.length > 0) {
                    this._staticURL = staticURL.val();
                }else {
                    this._staticURL = "/static/";
                }
            }
            return this._staticURL + url + "?v=" + this.getStaticVersionHash();
        },

        // 显示提示框
        // @param content 显示的消息内容
        // @param callback 显示后的回调
        showSplashPanel:function(content, callback) {
            if ($('.splash_panel').length > 0) {
                this.hideSplashPanel(null);
            }

            var _view = this;
            var _splashPanel = $('<div class="splash_panel"></div>').text(content);
            $('<div class="overlay"></div>').append(_splashPanel).appendTo('body').animate({
                opacity: 1
            }, 200, function() {
                require([
                    _view.convertStaticURLWithHash('js/views/animation/shiny_content.js')
                ], function(AnimateContentView) {
                    _view.splashPanelShinyContentView = new AnimateContentView({
                        container: _splashPanel
                    });
                    _splashPanel.fadeIn(function() {
                        _view.splashPanelShinyContentView.start();
                        if (callback) {
                            callback();
                        }
                    });
                });
            });
        },

        // 隐藏提示框
        // @param callback 成功过后的回调
        hideSplashPanel:function(callback) {
            $('.splash_panel').fadeOut(function() {
                $(this).parent().fadeOut().remove();
                if (callback) {
                    callback();
                }
            });
        }
    });
});