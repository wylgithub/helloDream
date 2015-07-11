define([
    'require',
    'jquery',
    'backbone',
    'routers/creditcard/management',
    'editable'
], function (require, $, Backbone, Router) {
    "use strict";

    return Backbone.View.extend({
        el:"body",
        in_syncing:false,  //防止两重提交标志位
        btnAddBlankCreditCard:$('#btnAddBlankCreditCard'),
        txtAmount:$('#txtAmount'),
        fetchOperationActivityStatusIntervalId:null,  // 定时刷新后台活动状态的Interval ID
        txtActivityStatus:$('#txtActivityStatus'),
        blankCardSummary:$('#blankCardSummary'),
        btnDelete:$('#btnDelete'),
        activeTab:null,  // 当前激活的tab
        order_id: "", // 订单id

        // 事件定义
        events:{
            'keydown input':'keyDownOnTextbox',  // 文本输入框按键响应事件
            'blur .card_id_textbox':'lostFocusOnCardIdTextbox',  // 点次卡输入文本输入框
            'focus .card_id_textbox':'focusOnCardIdTextbox',  // 点次卡输入文本输入框
            'click #checkSelectAll':'selectAll',
            'change .list_selector':'selectorChanged',  // 表格前面的checkbox选中事件
            'click .data_column':'sortColumn', // 排序
            'click #btnSearch':'search', //根据关键字搜索
            'click #btnPrevPage':'clickBtnPrevPage',  // 前页事件
            'click #btnNextPage':'clickBtnNextPage',  // 次页事件
            'click #btnDelete':'remove', //删除
            'change #txtAmount':'changeOnAmount', // 数量变更事件
            'click #btnCreateOrderReturn':'clickPopupReturnButton', // 新建订单面板返回按钮被按下
            'click #btnCreateOrderSave':'clickCreateOrderSaveButton', // 保存新订单
            'click #btnPopupReturn':'clickPopupReturnButton', // 绑定订单面板返回按钮被按下
            'click #btnAddBlankCreditCard':'addBlankCreditCard', // 增加空白点次卡
            'shown #pointsTab':'onPointsTabShown',  // 点卡tab显示
            'shown #timesTab':'onTimesTabShown',  // 次卡tab显示
            'click .btn-active': 'onActiveClick',  // 激活次卡订单
            'click .btn-active-confirm': 'onActiveConfirm',  // 激活次卡订单确认
            'click .btn-limited': 'onLimitedClick',  // 对次卡订单限定活动
            'click .btn-limited-confirm': 'onLimitedConfirm',  // 对次卡订单限定活动确认
            'click .btn-add-limited': 'onAddLimited',  // 添加限定活动
            'click .btn-del-limited': 'onDelLimited'  // 去除限定活动
        },

        // 初始化
        initialize:function() {
            // 初始化Router
            this.router = new Router({
                "view":this
            });
            Backbone.history.start();

            // 注册全局的按键事件
            $(document).on('keydown', function(event) {
                var obj;
                // ESC keydown
                if (event.keyCode === 27) {
                    obj = $('.esc_listener');
                    if (obj.length) {
                        obj[0].click();
                    }
                }else if (event.keyCode === 13) {
                    obj = $('.enter_listener');
                    if (obj.length) {
                        obj[0].click();
                    }
                }
            });

            // 当前激活的tab
            this.activeTab = 'dataList';

            // 初始化一览参数
            this.dataListParameter = {
                'fr':0,
                'od':'-',
                'of':'id'
            };

            // 刷新一览数据
            this.loadDataList();

            // 刷新空白卡统计信息
            this.refreshBlankCardSummary();
            // 抓取异步任务进度
            this.fetchOperationActivityStatus();
            // 刷新空白卡下载
            $(".blank_cards").each(function () {
                var link = $(this).attr('href');
                $(this).attr('href', link + '&card_type=0');
            });
        },

        // 文本输入框按键响应事件
        keyDownOnTextbox:function(event) {
            if (event.keyCode === 13) {
                var tid = $(event.target).attr('id');
                // 空白点卡数量的情况下
                if (tid === 'txtAmount') {
                    this.addBlankCreditCard();
                    event.stopPropagation();
                    return false;
                }else if (tid === 'txtCardIdFrom') {
                    // 数字From，跳转到下一个框
                    $('#txtCardIdTo').select();
                    event.stopPropagation();
                    return false;
                }else if (tid === 'txtCardIdTo') {
                    // 数字From，跳转到下一个框
                    $('#btnPopupNext')[0].click();
                    event.stopPropagation();
                    return false;
                }else if (tid === 'txtDescription') {
                    // 数字From，跳转到下一个框
                    $('#txtValue').select();
                    event.stopPropagation();
                    return false;
                }else if (tid === 'txtValue') {
                    // 数字From，跳转到下一个框
                    $('#txtPeriod').select();
                    event.stopPropagation();
                    return false;
                }else if (tid === 'txtPeriod') {
                    // 数字From，跳转到下一个框
                    $('#btnCreateOrderSave')[0].click();
                    event.stopPropagation();
                    return false;
                }else if (tid === 'queryKey') {
                    this.search();
                    event.stopPropagation();
                    return false;
                }
            }
            return true;
        },

        // 使弹出窗口从左侧消失
        // killOverlay:true 背景也消失， false 背景保留
        // callback:回调函数
        dismissPopupPanel:function(killOverlay, callback) {
            $('.popup').css('left', 0).animate({
                        opacity: 0,
                        left:-800
            }, 400, function() {
                if (killOverlay) {
                    $('#panelOverlay').fadeOut().remove();
                }
                if (callback) {
                    callback();
                }
            });
        },

        // 卡号输入框失去焦点事件，需要自动补0
        lostFocusOnCardIdTextbox:function(event) {
            var value = $(event.target).val();
            value = '000000000000' + value;
            $(event.target).val(value.substr(-12));
        },

        // 卡号输入框聚焦事件，需要自动去除0
        focusOnCardIdTextbox:function(event) {
            var value = $(event.target).val();
            var re = /0*(\d+)/;
            $(event.target).val(value.replace(re, "$1"));
        },

        // 绑定订单面板下一步按钮按下
        showBindOrderConfirmWindow:function(id) {
            var _url;
            if (this.activeTab === 'dataList') {
                _url = '/credit_card/order/' + id + '/confirm_b/';
            }else if (this.activeTab === 'timesList') {
                _url = '/times_card/times/order/' + id + '/confirm_b/';
            }
            // 动画撤销面板
            this.dismissPopupPanel(false);
            this.showOverlayPopupPanel(_url, {
                "from":$('#txtCardIdFrom').val(),
                "to":$('#txtCardIdTo').val()
            });
        },

        // 解除绑定订单面板下一步按钮按下
        showUnbindOrderConfirmWindow:function(id) {
            var _url;
            if (this.activeTab === 'dataList') {
                _url = '/credit_card/order/' + id + '/confirm_u/';
            }else if (this.activeTab === 'timesList') {
                _url = '/times_card/times/order/' + id + '/confirm_u/';
            }
            // 动画撤销面板
            this.dismissPopupPanel(false);
            this.showOverlayPopupPanel(_url, {
                "from":$('#txtCardIdFrom').val(),
                "to":$('#txtCardIdTo').val()
            });
        },

        // 订单激活点击
        onActiveClick: function(event){
            this.order_id = event.target.attributes['data-order-id'].value;
        },

        // 订单激活处理
        onActiveConfirm: function(){
            $('#active-confirm').modal('hide');
            var _url;
            if (this.activeTab === 'dataList') {
                _url = '/credit_card/order/' + this.order_id + '/active/action/';
            }else if (this.activeTab === 'timesList') {
                _url = '/times_card/times/order/' + this.order_id + '/active/action/';
            }
            var _view = this;
            this.options.parentView.trigger('start_ajax_sync');
            // 激活订单页面
            $.ajax({
                type: "POST",
                url: _url,
                success: function(data){
                    if (data.result) {
                        // 激活有延时，等待几秒钟
                        _view.options.parentView.showSplashPanel('订单激活中，请稍候...', function() {
                            window.setTimeout(function(){
                                if (_view.activeTab === 'dataList') {
                                    _view.loadDataList();
                                }else if (_view.activeTab === 'timesList') {
                                    _view.loadTimesOrderList();
                                }
                                // 刷新空白卡统计信息
                                _view.refreshBlankCardSummary();
                                // 抓取异步任务进度
                                _view.fetchOperationActivityStatus();
                                _view.options.parentView.hideSplashPanel();
                                _view.router.navigate('');  // 顺利保存后，应该回退到之前的页面，这里只跳转到最开始的页面，并且需要重新加载
                            }, 5000);
                        });
                    }else {
                        if (data.code === 1) {
                            window.alert('您要绑定的订单状态异常，无法执行激活功能。');
                            if (_view.activeTab === 'dataList') {
                                _view.loadDataList();
                            }else if (_view.activeTab === 'timesList') {
                                _view.loadTimesOrderList();
                            }
                        }else if (data.code === 2) {
                            window.alert('您要绑定的订单不存在，请确认后重试。');
                            if (_view.activeTab === 'dataList') {
                                _view.loadDataList();
                            }else if (_view.activeTab === 'timesList') {
                                _view.loadTimesOrderList();
                            }
                        }else {
                            window.alert('绑定操作发生未知错误，请确认后重试。');
                        }
                    }
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    _view.in_syncing = false;
                    _view.options.parentView.trigger('finish_ajax_sync');
                }
            });
        },

        // 查看限定影片
        onLimitedClick: function(event){
            event.preventDefault(); // prevent navigation
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var current_view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            this.order_id = event.target.attributes['data-order-id'].value;
            $.ajax({
                type: "GET",
                url: "/times_card/times/order/" + this.order_id + "/limited/",
                success: function(data){
                    if (data.error_code > 0) {
                        window.alert(data.error_msg);
                    }else {
                        var limitedModal = $("#limited_activity", data);
                        $('#limitedModal').html(limitedModal);
                        $("#limitedModal").modal('show');
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
            return false; // prevent the click propagation
        },

        // 添加限定影片
        onAddLimited: function(){
            $("#activities option:selected").each(function () {
                $("#limited").append($(this));
            });
        },

        // 去除限定影片
        onDelLimited: function(){
            $("#limited option:selected").each(function () {
                $("#activities").append($(this));
            });
        },

        // 提交限定影片
        onLimitedConfirm: function(event){
            event.preventDefault(); // prevent navigation
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var _view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var pk = '';
            if($('#limited').has('option').length > 0) {
                $('#limited option').each(function() {
                    pk = pk + $(this).val() + ',';
                });
            };
            $.ajax({
                type: "GET",
                url: "/times_card/times/order/" + this.order_id + "/limited/confirm/?q=" + pk,
                success: function(data){
                    if (data.error_code > 0) {
                        window.alert(data.error_msg);
                    }else {
                        $("#limitedModal").modal('toggle');
                        if (_view.activeTab === 'dataList') {
                            _view.loadDataList();
                        }else if (_view.activeTab === 'timesList') {
                            _view.loadTimesOrderList();
                        }
                        // 刷新空白卡统计信息
                        _view.refreshBlankCardSummary();
                        // 抓取异步任务进度
                        _view.fetchOperationActivityStatus();
                        _view.options.parentView.hideSplashPanel();
                        _view.router.navigate('');  // 顺利保存后，应该回退到之前的页面，这里只跳转到最开始的页面，并且需要重新加载
                    }
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    _view.options.parentView.trigger('finish_ajax_sync');
                    _view.in_syncing = false;
                }
            });
            return false; // prevent the click propagation
        },

        // 显示模态的弹出窗口共通函数
        // url: 异步访问的URL，应该返回一个html
        // params: 异步访问的参数
        // callback: 窗口弹出后需要调用的回调函数
        showOverlayPopupPanel:function(url, params, callback) {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var _view = this;
            var overlayContainer = $('#panelOverlay');
            if (overlayContainer.length === 0) {
                overlayContainer = $('<div id="panelOverlay" class="overlay"></div>');
            }
            // 将背景overlay层显示出来，动画效果意思是，从透明到不透明的一个渐变过程
            overlayContainer.appendTo("body").animate({
                opacity: 1
            }, 200, function() {
                // 读取创建订单页面
                $.ajax({
                    type: params?"POST":"GET",  // 当有参数params时改用POST方法，否则用GET方法
                    url: url,
                    data: params,
                    success: function(data){
                        overlayContainer.html(data);
                        // 将模式窗口定位到屏幕右侧，超出显示范围，因此定义一个负值
                        // 将模式窗口从右侧动画显示到屏幕居中
                        $('.popup').css('right', -800).animate({
                            opacity: 1,
                            right:0
                        }, 400, function() {
                            // 执行回调函数
                            if (callback) {
                                callback();
                            }
                        });
                    },
                    error: function(){
                        window.alert('与服务器通讯发生错误，请稍后重试。');
                    },
                    complete: function(){
                        //防止两重提交
                        //恢复现场
                        _view.in_syncing = false;
                        _view.options.parentView.trigger('finish_ajax_sync');
                    }
                });
            });
        },

        // 按下绑定按钮事件
        showBindOrderWindow:function(id) {
            var _url;
            if (this.activeTab === 'dataList') {
                _url = '/credit_card/order/' + id + '/bind/';
            }else if (this.activeTab === 'timesList') {
                _url = '/times_card/times/order/' + id + '/bind/';
            }
            this.showOverlayPopupPanel(_url, null, function() {
                $('#txtCardIdFrom').select();
            });
        },

        // 按下解除绑定按钮事件
        showUnbindOrderWindow:function(id) {
            var _url;
            if (this.activeTab === 'dataList') {
                _url = '/credit_card/order/' + id + '/unbind/';
            }else if (this.activeTab === 'timesList') {
                _url = '/times_card/times/order/' + id + '/unbind/';
            }
            this.showOverlayPopupPanel(_url, null, function() {
                $('#txtCardIdFrom').select();
            });
        },

        // 返回按钮被按下
        clickPopupReturnButton:function() {
            // 动画撤销面板
            var _view = this;
            this.dismissPopupPanel(true, function() {
                _view.router.navigate('');
            });
        },

        // 绑定订单
        bindOrder:function(id) {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var _url;
            if (this.activeTab === 'dataList') {
                _url = '/credit_card/order/' + id + '/bind/action/';
            }else if (this.activeTab === 'timesList') {
                _url = '/times_card/times/order/' + id + '/bind/action/';
            }
            var _view = this;
            // 读取创建订单页面
            $.ajax({
                type: "POST",
                url: _url,
                data: {
                    "from":$('#hidFrom').val(),
                    "to":$('#hidTo').val(),
                    "update_timestamp":$('#hidUpdateTimestamp').val()
                },
                success: function(data){
                    if (data.result) {
                        _view.dismissPopupPanel(true, function() {
                            // 绑定有延时，等待几秒钟
                            _view.options.parentView.showSplashPanel('订单绑定中，请稍候...', function() {
                                window.setTimeout(function(){
                                    if (_view.activeTab === 'dataList') {
                                        _view.loadDataList();
                                    }else if (_view.activeTab === 'timesList') {
                                        _view.loadTimesOrderList();
                                    }
                                    // 刷新空白卡统计信息
                                    _view.refreshBlankCardSummary();
                                    // 抓取异步任务进度
                                    _view.fetchOperationActivityStatus();
                                    _view.options.parentView.hideSplashPanel();
                                    _view.router.navigate('');  // 顺利保存后，应该回退到之前的页面，这里只跳转到最开始的页面，并且需要重新加载
                                }, 5000);
                            });
                        });
                    }else {
                        if (data.code === 1) {
                            window.alert('缺少必须的参数。');
                        }else if (data.code === 2) {
                            window.alert('您输入的卡号不是有效的数字。');
                        }else if (data.code === 3) {
                            window.alert('您要绑定的订单状态异常，无法执行绑定功能。');
                            if (_view.activeTab === 'dataList') {
                                _view.loadDataList();
                            }else if (_view.activeTab === 'timesList') {
                                _view.loadTimesOrderList();
                            }
                        }else if (data.code === 4) {
                            window.alert('您要绑定的订单不存在，请确认后重试。');
                            if (_view.activeTab === 'dataList') {
                                _view.loadDataList();
                            }else if (_view.activeTab === 'timesList') {
                                _view.loadTimesOrderList();
                            }
                        }else if (data.code === 5) {
                            window.alert('订单已经被他人修改过了，请刷新后重试。');
                            if (_view.activeTab === 'dataList') {
                                _view.loadDataList();
                            }else if (_view.activeTab === 'timesList') {
                                _view.loadTimesOrderList();
                            }
                        }else {
                            window.alert('绑定操作发生未知错误，请确认后重试。');
                        }
                    }
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    _view.in_syncing = false;
                    _view.options.parentView.trigger('finish_ajax_sync');
                }
            });
        },

        // 解除绑定订单
        unbindOrder:function(id) {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var _url;
            if (this.activeTab === 'dataList') {
                _url = '/credit_card/order/' + id + '/unbind/action/';
            }else if (this.activeTab === 'timesList') {
                _url = '/times_card/times/order/' + id + '/unbind/action/';
            }
            var _view = this;
            // 读取创建订单页面
            $.ajax({
                type: "POST",
                url: _url,
                data: {
                    "from":$('#hidFrom').val(),
                    "to":$('#hidTo').val(),
                    "update_timestamp":$('#hidUpdateTimestamp').val()
                },
                success: function(data){
                    if (data.result) {
                        _view.dismissPopupPanel(true, function() {
                            // 绑定有延时，等待几秒钟
                            _view.options.parentView.showSplashPanel('订单解除绑定中，请稍候...', function() {
                                window.setTimeout(function(){
                                    if (_view.activeTab === 'dataList') {
                                        _view.loadDataList();
                                    }else if (_view.activeTab === 'timesList') {
                                        _view.loadTimesOrderList();
                                    }
                                    // 刷新空白卡统计信息
                                    _view.refreshBlankCardSummary();
                                    // 抓取异步任务进度
                                    _view.fetchOperationActivityStatus();
                                    _view.options.parentView.hideSplashPanel();
                                    _view.router.navigate('');  // 顺利保存后，应该回退到之前的页面，这里只跳转到最开始的页面，并且需要重新加载
                                }, 5000);
                            });
                        });
                    }else {
                        if (data.code === 1) {
                            window.alert('缺少必须的参数。');
                        }else if (data.code === 2) {
                            window.alert('您输入的卡号不是有效的数字。');
                        }else if (data.code === 3) {
                            window.alert('您要解除绑定的订单状态异常，无法执行解除绑定功能。');
                            if (_view.activeTab === 'dataList') {
                                _view.loadDataList();
                            }else if (_view.activeTab === 'timesList') {
                                _view.loadTimesOrderList();
                            }
                        }else if (data.code === 4) {
                            window.alert('您要解除绑定的订单不存在，请确认后重试。');
                            if (_view.activeTab === 'dataList') {
                                _view.loadDataList();
                            }else if (_view.activeTab === 'timesList') {
                                _view.loadTimesOrderList();
                            }
                        }else if (data.code === 5) {
                            window.alert('订单已经被他人修改过了，请刷新后重试。');
                            if (_view.activeTab === 'dataList') {
                                _view.loadDataList();
                            }else if (_view.activeTab === 'timesList') {
                                _view.loadTimesOrderList();
                            }
                        }else {
                            window.alert('绑定操作发生未知错误，请确认后重试。');
                        }
                    }
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    _view.in_syncing = false;
                    _view.options.parentView.trigger('finish_ajax_sync');
                }
            });
        },

        // 保存新订单
        clickCreateOrderSaveButton:function() {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var _view = this;
            var _txtDescription = $('#txtDescription');  // 订单描述输入框
            var _txtValue = $('#txtValue'); // 卡内金额输入框
            var _txtPeriod = $('#txtPeriod'); // 卡有效期输入框
            // 读取创建订单页面
            $.ajax({
                type: "POST",
                url: '/credit_card/create_new_order/action/',
                data: {
                    "description":_txtDescription.val(),
                    "value":_txtValue.val(),
                    "period":_txtPeriod.val()
                },
                success: function(data){
                    if (data.result) {
                        $('.popup').css('left', 0).animate({
                                    opacity: 0,
                                    left:-800
                        }, 400, function() {
                            $('#panelOverlay').fadeOut().remove();
                            _view.loadDataList();
                            _view.router.navigate('');  // 顺利保存后，应该回退到之前的页面，这里只跳转到最开始的页面，并且需要重新加载
                        });
                    }else {
                        if (data.code === 1) {
                            window.alert('请求缺少参数。');
                            _txtDescription.focus();
                        }else if (data.code === 2) {
                            window.alert('订单描述不能为空或者长度超过200个字符。');
                            _txtDescription.focus();
                        }else if (data.code === 3) {
                            window.alert('卡内金额必须是个大于0小于10000的整数。');
                            _txtValue.focus();
                        }else if (data.code === 4) {
                            window.alert('卡有效期必须是个大于0小于1000的整数，代表有效月数。');
                            _txtPeriod.focus();
                        }
                    }
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    _view.in_syncing = false;
                    _view.options.parentView.trigger('finish_ajax_sync');
                }
            });
        },

        // 创建新订单
        createOrder:function() {
            this.showOverlayPopupPanel('/credit_card/create_new_order/', null, function() {
                // 聚焦在控件上
                $('#txtDescription').focus();
            });
        },

        // 数量变更事件
        changeOnAmount:function(event) {
            this.btnAddBlankCreditCard.prop('disabled', !($(event.target).val() > 0 && $(event.target).val() < 100000));
        },

        // 刷新空白卡统计信息
        refreshBlankCardSummary:function() {
            var _url;
            if (this.activeTab === 'dataList') {
                _url = '/credit_card/blank_card_summary/';
            }else if (this.activeTab === 'timesList') {
                _url = '/times_card/blank_times_card_summary/';
            }
            var _view = this;
            this.options.parentView.trigger('start_ajax_sync');
            $.ajax({
                type: "GET",
                url: _url,
                success: function(data){
                    _view.blankCardSummary.html(data);
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    _view.options.parentView.trigger('finish_ajax_sync');
                }
            });
        },

        // 添加空白点次卡
        addBlankCreditCard:function() {
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            this.btnAddBlankCreditCard.prop('disabled', true);
            var _times_card;
            if (this.activeTab === 'dataList') {
                _times_card = 0;
            }else if (this.activeTab === 'timesList') {
                _times_card = 1;
            }
            var _view = this;
            this.options.parentView.trigger('start_ajax_sync');
            $.ajax({
                type: "POST",
                url: '/credit_card/add_blank_card/',
                data: {
                    "amount":_view.txtAmount.val(),
                    "times_card":_times_card
                },
                success: function(data){
                    if (data.result) {
                        // 成功添加任务
                        _view.options.parentView.showSplashPanel('空白卡生成中，请稍候...', function() {
                            // celery分配任务需要有一定的延时，这里设定一下，3秒后开始刷新活动状态
                            // 避免celery还没开始创建，这里会刷不出正确的状态
                            window.setTimeout(function() {
                                _view.options.parentView.hideSplashPanel();
                                _view.txtAmount.val(1);
                                _view.fetchOperationActivityStatus();
                            }, 5000);
                        });
                    }else {
                        // 添加任务失败
                        if (data.code === 10) {
                            window.alert('请填入数字。');
                        }else {
                            window.alert('请填入大于0，小于100000的数字。');
                        }
                        _view.txtAmount.focus();
                    }
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    _view.options.parentView.trigger('finish_ajax_sync');
                    _view.in_syncing = false;
                }
            });
        },

        // 抓取异步任务进度
        fetchOperationActivityStatus:function() {
            var _view = this;
            this.options.parentView.trigger('start_ajax_sync');
            $.ajax({
                type: "GET",
                url: '/credit_card/operation_activity_status/',
                success: function(data){
                    if (data.result) {
                        // 存在正在执行的任务
                        _view.txtActivityStatus.text('后台任务需要生成' + data.activity.amount +
                            '张空白卡，' +
                            '目前运行状态为：' + data.activity.status +
                            '。');
                        _view.btnAddBlankCreditCard.prop('disabled', data.lock);

                        // 因为有存在进行中的任务，所以必须维持一个定时刷新的进程存在
                        // 如果Interval ID不存在，则需要开一个进程 3秒刷新一次
                        if (!_view.fetchOperationActivityStatusIntervalId) {
                            _view.fetchOperationActivityStatusIntervalId = window.setInterval(function() {
                                _view.fetchOperationActivityStatus();
                            }, 3000);
                        }
                        // 如果本来就已经有interval id存在了，则表明本次运行是属于这个interval反复调用引起的，这里不做任何处理，继续等待下次调用。
                    }else {
                        // 没有正在执行的任务
                        _view.txtActivityStatus.text('');
                        _view.btnAddBlankCreditCard.prop('disabled', 0);
                        // 没有任务的话，如果interval id还存在，则需要停止这个后台进程
                        if (_view.fetchOperationActivityStatusIntervalId) {
                            window.clearInterval(_view.fetchOperationActivityStatusIntervalId);
                            _view.fetchOperationActivityStatusIntervalId = null;
                        }
                        // 刷新空白卡统计信息
                        _view.refreshBlankCardSummary();
                    }
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    _view.options.parentView.trigger('finish_ajax_sync');
                }
            });
        },

        // 异步加载订单一览
        loadDataList:function() {
            var _view = this;
            this.options.parentView.trigger('start_ajax_sync');
            $.ajax({
                type: "GET",
                url: '/credit_card/order/list/',
                data: _view.dataListParameter,
                success: function(data){
                    $('#dataList').html(data).fadeIn();
                    _view.toggleCommandButtonStatus();
                    _view.initPaginationStatus();
                    _view.initColumnOrderStatus();
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    // 有效截止日
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

                    $(document).ready(function() {
                        $('.tip').tooltip();
                    });
                    //防止两重提交
                    //恢复现场
                    _view.options.parentView.trigger('finish_ajax_sync');
                }
            });
        },

        // 异步加载次卡订单一览
        loadTimesOrderList:function() {
            var _view = this;
            this.options.parentView.trigger('start_ajax_sync');
            $.ajax({
                type: "GET",
                url: '/times_card/times_order/list/',
                data: _view.dataListParameter,
                success: function(data){
                    $('#timesList').html(data).fadeIn();
                    _view.toggleCommandButtonStatus();
                    _view.initPaginationStatus();
                    _view.initColumnOrderStatus();
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    // 有效截止日
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

                    $(document).ready(function() {
                        $('.tip').tooltip();
                    });
                    //防止两重提交
                    //恢复现场
                    _view.options.parentView.trigger('finish_ajax_sync');
                }
            });
        },

        // 排序列状态初始化
        initColumnOrderStatus:function() {
            // 初始化排序列的表头
            var logo_css;
            if (this.dataListParameter.od === '-') {
                logo_css = 'icon-arrow-down';
            }else {
                logo_css = 'icon-arrow-up';
            }
            $('.data_column[sort_key=' + this.dataListParameter.of + ']').append('<li class="' + logo_css + '"></li>');

        },

        // 搜索
        search:function() {
            // 实现搜索功能
            this.dataListParameter.q = $('#queryKey').val();
            this.dataListParameter.fr = 0;
            if (this.activeTab === 'dataList') {
                this.loadDataList();
            }else if (this.activeTab === 'timesList') {
                this.loadTimesOrderList();
            }
        },

        // 删除
        remove:function() {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            this.btnDelete.prop('disabled', true);
            var _url;
            if (this.activeTab === 'dataList') {
                _url = '/credit_card/order/delete/action/';
            }else if (this.activeTab === 'timesList') {
                _url = '/times_card/times/order/delete/action/';
            }
            var _view = this;
            this.options.parentView.trigger('start_ajax_sync');
            var pk = '';
            $('.list_selector:checked').each(function(index, value) {
                pk = pk + $(value).attr('pk') + ',';
            });
            $.ajax({
                type: "POST",
                url: _url,
                data: {
                    "pk":pk
                },
                success: function(){
                    // 将选择状态重置为0
                    $('#checkSelectAll').prop('checked', false);
                    _view.selectAll();
                    _view.options.parentView.showSplashPanel('订单删除中，请稍候...', function() {
                        // celery分配任务需要有一定的延时，这里设定一下，5秒后开始刷新活动状态
                        // 避免celery还没开始创建，这里会刷不出正确的状态
                        window.setTimeout(function() {
                            _view.options.parentView.hideSplashPanel(function() {
                                // 重新加载一览数据
                                if (_view.activeTab === 'dataList') {
                                    _view.loadDataList();
                                }else if (_view.activeTab === 'timesList') {
                                    _view.loadTimesOrderList();
                                }
                            });
                        }, 5000);
                    });
                },
                error: function(){
                    window.alert('与服务器通讯发生错误，请稍后重试。');
                },
                complete: function(){
                    //防止两重提交
                    //恢复现场
                    _view.options.parentView.trigger('finish_ajax_sync');
                    _view.in_syncing = false;
                    _view.btnDelete.prop('disabled', false);
                }
            });
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
            var of = $(event.target).attr('sort_key');
            if (this.dataListParameter.of === of) {
                // 如果排序字段一致，则翻转排序方向
                this.dataListParameter.od = this.dataListParameter.od==='-'?'':'-';
            }else {
                this.dataListParameter.of = of;
                this.dataListParameter.od = '';
            }
            if (this.activeTab === 'dataList') {
                this.loadDataList();
            }else if (this.activeTab === 'timesList') {
                this.loadTimesOrderList();
            }
        },

        // 一览分页元素初始化使用
        initPaginationStatus:function() {

            // 读取刷新最新的页面数据隐藏值
            this.dataListParameter.fr = parseInt($('#qs_from').val(), 10);
            this.dataListParameter.lm = parseInt($('#qs_limit').val(), 10);
            this.dataListParameter.to = parseInt($('#qs_to').val(), 10);
            this.dataListParameter.od = $('#qs_order_direction').val();
            this.dataListParameter.of = $('#qs_order_field').val();
            var total_count = parseInt($('#total_count').val(), 10);

            // 页面统计数据刷新
            var page_number = Math.ceil(total_count / this.dataListParameter.lm);
            var current_page = this.dataListParameter.fr / this.dataListParameter.lm + 1;
            $('#lblPageCounter').text(current_page + "/" + page_number + "页");

            //前页
            if (this.dataListParameter.fr <= 0) {
                $('#btnPrevPage').addClass('disabled');
            }

            //次页
            if (this.dataListParameter.fr + this.dataListParameter.lm >= total_count) {
                $('#btnNextPage').addClass('disabled');
            }
        },

        // 前页按钮按下事件
        clickBtnPrevPage:function() {
            if ($('#btnPrevPage').hasClass('disabled')) {
                return false;
            }
            this.dataListParameter.fr -= this.dataListParameter.lm;
            if (this.dataListParameter.fr < 0) {
                this.dataListParameter.fr = 0;
            }
            if (this.activeTab === 'dataList') {
                this.loadDataList();
            }else if (this.activeTab === 'timesList') {
                this.loadTimesOrderList();
            }
        },

        // 次页按钮按下事件
        clickBtnNextPage:function() {
            if ($('#btnNextPage').hasClass('disabled')) {
                return false;
            }
            this.dataListParameter.fr += this.dataListParameter.lm;
            if (this.activeTab === 'dataList') {
                this.loadDataList();
            }else if (this.activeTab === 'timesList') {
                this.loadTimesOrderList();
            }
        },

        // 一览前置选择框状态变化使用
        toggleCommandButtonStatus:function() {
            var selectedNum = $('.list_selector:checked').length;
            var btnDelete = $('#btnDelete');
            if (btnDelete) {
                btnDelete.prop('disabled', selectedNum === 0);
                if (selectedNum !== 0) {
                    btnDelete.removeClass('disabled');
                }else {
                    btnDelete.addClass('disabled');
                }
            }
        },

        // 点卡tab显示
        onPointsTabShown:function() {
            // 修改空白卡提示
            $('#txtAmount').attr('placeholder', '点卡数量');
            // 修改增加空白卡按钮的内容
            $('#btnAddBlankCreditCard').html('增加空白点卡');
            // 当前激活的tab
            this.activeTab = 'dataList';

            // 初始化一览参数
            this.dataListParameter = {
                'fr':0,
                'od':'-',
                'of':'id'
            };

            // 刷新一览数据
            this.loadDataList();

            // 刷新空白卡统计信息
            this.refreshBlankCardSummary();
            // 抓取异步任务进度
            this.fetchOperationActivityStatus();
            // 刷新空白卡下载
            $(".blank_cards").each(function () {
                var link = $(this).attr('href');
                $(this).attr('href', link.replace('&card_type=1', '&card_type=0'));
            });

            // 次卡tab清空
            $('#timesList').html('<div class="table_loading">数据加载中，请稍候。</div>').fadeIn;
        },

        // 次卡tab显示
        onTimesTabShown:function() {
            // 修改空白卡提示
            $('#txtAmount').attr('placeholder', '次卡数量');
            // 修改增加空白卡按钮的内容
            $('#btnAddBlankCreditCard').html('增加空白次卡');

            // 当前激活的tab
            this.activeTab = 'timesList';

            // 初始化一览参数
            this.dataListParameter = {
                'fr':0,
                'od':'-',
                'of':'id'
            };

            // 刷新一览数据
            this.loadTimesOrderList();

            // 刷新空白卡统计信息
            this.refreshBlankCardSummary();
            // 抓取异步任务进度
            this.fetchOperationActivityStatus();
            // 刷新空白卡下载
            $(".blank_cards").each(function () {
                var link = $(this).attr('href');
                $(this).attr('href', link.replace('&card_type=0', '&card_type=1'));
            });

            // 点卡tab清空
            $('#dataList').html('<div class="table_loading">数据加载中，请稍候。</div>').fadeIn;
        }
    });
});
