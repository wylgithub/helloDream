define([
    'require',
    'jquery',
    'backbone',
    'ZeroClipboard',
    'datepicker',
    'datetimepicker',
    'datetimepickerCN',
    'jqueryuiprogressbar',
    'wysi1',
    'wysi2',
    'wysi3'
], function (require, $, Backbone, ZeroClipboard) {
    "use strict";

    return Backbone.View.extend({
        el: "body",
        in_syncing: false,  //防止两重提交标志位
        upload_image_index: -1,  // 上传图片index
        delete_image_index: -1,  // 删除图片index
//        copy_link_index:-1,  // 复制图片地址index

        events:{
            'click .dropdownItem': 'dropdownItem_click',
            'click #btnReturn': 'return_to_prev_page',
            'click #btnSave': 'save_click',
            'click #btnFetch': 'fetch_click',
            'change #uploadFile': 'onUploadFileChanged',
            'click .btn-upload': 'onUploadFileClicked',
            'click .btn-delete': 'onDeleteFileClicked',
            'click .btn-delete-image-confirm': 'onDeleteConfirm',
            'click .goods_edit': 'onGoodsEditClicked',
            'click .btn-goods-edit': 'onGoodsEditEnterClicked',
            'click #checkSelectAll':'selectAll',
            'change .list_selector':'selectorChanged',
            'click #btnDelete':'remove_click', //删除
//            'click #d_clip_button2': 'clipClick'
//            'click #btn-copy-link3': 'onCopyLink'
            'click #btn_add_to': 'btn_add_to',  //添加规格按钮事件
            'click #btnClear': 'btn_Clear', //清空规格按钮事件
            'click .goods_cake_edit': 'onGoodsCakeEditClicked',
            'click .btn-cake-goods-edit': 'onGoodsCakeEditEnterClicked'
        },

        onUploadFileClicked: function(event) {
            var index = event.target.attributes['data-upload-index'].value;
            this.upload_image_index = index;
            $('#uploadFile').trigger('click');
        },

        onUploadFileChanged: function() {
            if (!this.supportAjaxUploadWithProgress()) {
                return false;
            }

            this.options.parentView.trigger('start_ajax_sync');

            var formData = new FormData();
            formData.append('csrfmiddlewaretoken', $('input[name=csrfmiddlewaretoken]').first().val());
            formData.append('uploadFile', $('#uploadFile')[0].files[0]);
            formData.append('imageType', 'activity');
            formData.append('imageIndex', this.upload_image_index);
            formData.append('activityId', $('#pk').val());

            // Get an XMLHttpRequest instance
            var xhr = new XMLHttpRequest();
            var __view = this;
            // Set up events
            xhr.upload.addEventListener('loadstart', this.onloadstartHandler, false);
            xhr.upload.addEventListener('progress', this.onprogressHandler, false);
            xhr.addEventListener('readystatechange', function(event) {
                var readyState = null;
                var status = null;
                var imageIndex = null;

                try {
                    readyState = event.target.readyState;
                    status = event.target.status;
                }
                catch(e) {
                    return;
                }

                if (readyState === 4 && status === 200) {
                    if ($.parseJSON(event.target.responseText).error_code > 0) {
                        $('#uploadFileContainer .uploadScence2').hide();
                        $('#uploadFile').val('');
                        window.alert($.parseJSON(event.target.responseText).error_msg);
                        $("#progressbar").progressbar( "destroy" );
                    }else {
                        imageIndex = __view.upload_image_index;
                        $('#uploadFileContainer .uploadScence2').hide();
                        $('#uploadFileContainer #uploadFile').replaceWith('<input type="file" name="uploadFile" id="uploadFile"/>');
                        $('#uploadFileContainer #image_id' + imageIndex).val($.parseJSON(event.target.responseText).image_id);
                        if (imageIndex < 5) {
                            $('#uploadFileContainer #image_flg' + imageIndex).val("True");
                            $('[data-upload-index="' + imageIndex + '"]').replaceWith(
                                '<div id="image-group' + imageIndex + '">' +
                                '<button type="button" class="btn btn-danger btn-mini btn-delete" data-delete-index="' + imageIndex + '" ' +
                                'data-toggle="modal" href="#delete-image-confirm" data-show="true">' +
                                '<i class="icon-trash icon-white"></i> 删除</button>' +
                                '<a href="javascript: void(0);" class="thumbnail"><img src="' + $.parseJSON(event.target.responseText).image_url + '" alt=""></a>' +
                                '</div>'
                            );
                        }else {
                            $('[data-upload-index="' + imageIndex + '"]').replaceWith(
                                '<div id="image-group' + imageIndex + '">' +
                                '<button type="button" class="btn btn-danger btn-mini btn-delete" data-delete-index="' + imageIndex + '" ' +
                                'data-toggle="modal" href="#delete-image-confirm" data-show="true">' +
                                '<i class="icon-trash icon-white"></i> 删除</button> ' +
                                '<input class="span5" type="text" value="' + $.parseJSON(event.target.responseText).image_url + '" readonly/>' +
                                '<a href="javascript: void(0);" class="thumbnail"><img src="' + $.parseJSON(event.target.responseText).image_url + '" alt=""></a>' +
                                '</div>'
                            );
                        }

                        $("#progressbar").progressbar( "destroy" );
                    }
                    __view.options.parentView.trigger('finish_ajax_sync');
                }
            }, false);

            // Set up request
            xhr.open('POST', '/upyun/upload/', true);

            // Fire!
            xhr.send(formData);
        },

        onDeleteFileClicked: function(event) {
            var index = event.target.attributes['data-delete-index'].value;
            this.delete_image_index = index;
        },

        onDeleteConfirm: function() {
            $('#uploadFileContainer #delete-image-confirm').modal('hide');

            if (!this.supportAjaxUploadWithProgress()) {
                return false;
            }

            var index = this.delete_image_index;
            this.options.parentView.trigger('start_ajax_sync');

            var formData = new FormData();
            formData.append('csrfmiddlewaretoken', $('input[name=csrfmiddlewaretoken]').first().val());
            formData.append('imageType', 'activity');
            formData.append('imageId', $('#image_id' + index).val());
            formData.append('imageIndex', index);
            formData.append('activityId', $('#pk').val());

            // Get an XMLHttpRequest instance
            var xhr = new XMLHttpRequest();
            var __view = this;
            // Set up events
            xhr.addEventListener('readystatechange', function(event) {
                var readyState = null;
                var status = null;
                var deleteIndex = null;

                try {
                    readyState = event.target.readyState;
                    status = event.target.status;
                }
                catch(e) {
                    return;
                }

                if (readyState === 4 && status === 200 && event.target.responseText) {
                    if ($.parseJSON(event.target.responseText).error_code > 0) {
                        window.alert($.parseJSON(event.target.responseText).error_msg);
                    }else {
                        deleteIndex = __view.delete_image_index;
                        $('#uploadFileContainer #image_id' + deleteIndex).val("");
                        if (deleteIndex < 5) {
                            $('#uploadFileContainer #image_flg' + deleteIndex).val("False");
                        }
                        $('#uploadFileContainer #image-group' + deleteIndex).replaceWith(
                            '<button type="button" class="btn btn-primary btn-mini btn-upload" data-upload-index="'
                                + deleteIndex + '"><i class="icon-upload icon-white"></i> 上传</button>'
                        );
                    }
                    __view.options.parentView.trigger('finish_ajax_sync');
                }
            }, false);

            // Set up request
            xhr.open('POST', '/upyun/delete/', true);

            // Fire!
            xhr.send(formData);
        },

//        onCopyLink: function(event) {
//            var index = event.currentTarget.attributes['data-copy-link'].value;
//            this.copy_link_index = index;
//            var link = $('#uploadFileContainer #image_url' + index).val();
//            var clip = new ZeroClipboard($("btn-copy-link3"));
//        },

        initialize:function() {
            $('#id_start_date').datepicker().on('changeDate', function(event) {
                $(event.target).datepicker('hide');
            });
            $('#id_end_date').datepicker().on('changeDate', function(event) {
                $(event.target).datepicker('hide');
            });
            $('#id_origin_date').datepicker().on('changeDate', function(event) {
                $(event.target).datepicker('hide');
            });
            $('.goods_match').datetimepicker({
                format: 'yyyy-MM-dd hh:mm',
                pickSeconds: false,
                language: 'zh-CN'
            });

            $('#btnSave').popover({
                placement: "top",
                trigger: "hover",
                title: "提示",
                delay: {show:1000, hide:100},
                content: "保存活动信息的修改。"
            });

            $(document).ready(function() {
                $('.tip').tooltip();

                $('#id_content').wysihtml5({
                    locale: "zh-CN",
                    "justify": true,
                    "html": true,
                    "image": true,
                    "color": true,
                    "stylesheets": ["http://static.piaoshifu.cn/cms/css/wysiwyg-extend.css"]
                });

                $('#id_content').data("wysihtml5").editor.setValue($('#article_content').val(), true);

            });

            if (!this.supportAjaxUploadWithProgress()) {
                window.alert('您的浏览器不支持上传功能，请安装使用最新的浏览器!');
                $('#uploadFile').attr('disabled', true);
            };
        },


        //规格添加按钮事件
        btn_add_to:function(){
            if(!this.validate(event)){
                return;
            }
            else{
                //将规格和价格组合之后添加到规格显示框内
                var cake_standard_price=((($("#id_standard").val()+$("#txt_standard").val())+"磅")+":"+($("#id_price").val()))+',';
                $("#id_standard").val(cake_standard_price);
            }
        },

        //清空规格内容按钮事件
        btn_Clear:function(event){
             $("#id_standard").val("");
        },

        onGoodsEditClicked: function(event) {
            event.preventDefault(); // prevent navigation
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var current_view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var url = $(event.target).data("form"); // get the contact form url
            $.ajax({
                type: "GET",
                url: url,
                success: function(data){
                    if (data.error_code > 0) {
                        window.alert(data.error_msg);
                    }else {
                        var goodsForm = $("#frmEditGoods", data);
                        $('#goodsFormModal').html(goodsForm);
                        $('.goods_match').datetimepicker({
                            format: 'yyyy-MM-dd hh:mm',
                            pickSeconds: false,
                            language: 'zh-CN'
                        });
                        $("#goodsFormModal").modal('show');
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

        onGoodsEditEnterClicked: function(){
            event.preventDefault(); // prevent navigation
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var current_view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var form = $('#frmEditGoods');
            $.ajax({
                type: "POST",
                url: form.attr('action'),
                data: form.serialize(), // serializes the form's elements.
                success: function(data) {
                    if (data.error_code > 0) {
                        window.alert(data.error_msg);
                    }else {
                        var goodsForm = $("#frmEditGoods", data);
                        $('#goodsFormModal').html(goodsForm);
                        var validation = $('#id_validation').val();
                        if (validation === "True") {
                            var url = "/activity/" + $('#pk').val() + "/goods/list/";
                            $.ajax({
                                type: "GET",
                                url: url,
                                success: function(data){
                                    if (data.error_code > 0) {
                                        window.alert(data.error_msg);
                                    }else {
                                        $('#goodsList').html(data);
                                        $('.tip').tooltip();
                                    }
                                },
                                error: function(){
                                    window.alert('与服务器通讯发生错误，请稍后重试。');
                                }
                            });
                            $("#goodsFormModal").modal('hide');
                        }else {
                            $('.goods_match').datetimepicker({
                                format: 'yyyy-MM-dd hh:mm',
                                pickSeconds: false,
                                language: 'zh-CN'
                            });
                        }
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
            return false; // avoid to execute the actual submit of the form.
        },

        onGoodsCakeEditClicked: function(event) {
            event.preventDefault(); // prevent navigation
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var current_view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            //拼接url：data-form_cake="/activity/{{ form.instance.id }}/cake/create/"
            var url = $(event.target).data("form"); // get the contact form url
            $.ajax({
                type: "GET",
                url: url,
                success: function(data){
                    if (data.error_code > 0) {
                        window.alert(data.error_msg);
                    }else {
                        var goodsCakeForm = $("#frmCakeEditGoods", data);
                        $('#goodsCakeFormModal').html(goodsCakeForm);

                        //对时间显示的格式进行设置
                        $('#id_origin_date').datetimepicker({
                            format: 'yyyy-MM-dd',
                            pickSeconds: false,
                            language: 'zh-CN'
                        });
                        $("#goodsCakeFormModal").modal('show');
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

        onGoodsCakeEditEnterClicked: function(){
            if(!this.check_standard(event)){
                return;
            }
            event.preventDefault(); // prevent navigation
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var current_view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var form = $('#frmCakeEditGoods');
            $.ajax({
                type: "POST",
                url: form.attr('action'),
                data: form.serialize(), // serializes the form's elements.
                success: function(data) {
                    if (data.error_code > 0) {
                        window.alert(data.error_msg);
                    }else {
                        var goodsForm = $("#frmCakeEditGoods", data);
                        $('#goodsCakeFormModal').html(goodsForm);
                        var validation = $('#id_validation').val();
                        if (validation === "True") {
                            var url = "/activity/" + $('#pk').val() + "/goods/list/";
                            //通过异步的形式将生成的商品显示到页面
                            $.ajax({
                                type: "GET",
                                url: url,
                                success: function(data){
                                    if (data.error_code > 0) {
                                        window.alert(data.error_msg);
                                    }else {
                                        $('#goodsList').html(data);
                                        $('.tip').tooltip();
                                    }
                                },
                                error: function(){
                                    window.alert('与服务器通讯发生错误，请稍后重试。');
                                }
                            });
                            $("#goodsCakeFormModal").modal('hide');
                        }
                        else {
                            $('#id_origin_date').datetimepicker({
                                format: 'yyyy-MM-dd',
                                pickSeconds: false,
                                language: 'zh-CN'
                            });
                        }
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
            return false; // avoid to execute the actual submit of the form.
        },

        check_standard:function(event){
            var standard = $("#id_standard").val(); //取得前端规格和价格组合输入框
            if(standard == ""){
                alert("规格和价格的组合输入框内容不能为空！");
                return false;
            }
            return true;
        },

        validate: function(event){
            var standard = $("#txt_standard").val();    // 获取前端规格输入框的内容
            var price = $("#id_price").val();   // 获取前端价格输入框的内容
            if(standard == ""){
                alert("规格不可以为空！");
                return false;
            }
            if(price == 0 || price.search("^[0-9]*[1-9][0-9]*$") != 0){
                alert("价格不可以为空，而且必须为整数！");
                return false;
            }
            return true;
        },

        // 保存
        save_click:function() {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            $('#btnSave').prop('disabled', true);

            $('#frmEditActivity').submit();
        },

        // 取入
        fetch_click:function() {
            var url, ru;
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            $('#btnSave').prop('disabled', true);

            url = '/activity/' + $('#id_kind').val() + '/refetch/' + $('#pk').val() + '/';
            ru = $('#next');
            if (!ru || ru.length === 0 || !ru.val()) {
                url = url;
            }else {
                url = url + '?next=' + encodeURIComponent(ru.val());
            }

            window.location.href = url;
        },

        // 返回活动一览
        return_to_prev_page:function() {
            var ru = $('#next');
            var url;
            if (!ru || ru.length === 0 || !ru.val()) {
                url = '/activity/' + $('#id_kind').val() + '/list/';
            }else {
                url = ru.val();
            }
            window.location.href = url;
        },

        // 选择
        dropdownItem_click:function(event) {
            var element = $(event.target);
            var id = element.attr('for');
            $("#" + id).val(element.attr('value'));
            $("#" + id + '_trigger').text(element.text());
        },

        // 删除数据
        remove_click:function () {
            // 删除确认对话框
            if (!window.confirm("警告，请确认是否要删除选中的商品？")) {
                return;
            }

            $('#btnDelete').addClass('disabled');

            var pks = '';
            $('.list_selector:checked').each(function (index, value) {
                pks = pks + $(value).attr('pk') + ',';
            });
            $('#id_goods_pks').val(pks);

            event.preventDefault(); // prevent navigation
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            var current_view = this;
            this.in_syncing = true;
            this.options.parentView.trigger('start_ajax_sync');
            var form = $('#frmGoodsList');
            $.ajax({
                type: "POST",
                url: form.attr('action'),
                data: form.serialize(), // serializes the form's elements.
                success: function(data) {
                    if (data.error_code > 0) {
                        window.alert(data.error_msg);
                    }else {
                        $('#goodsList').html(data);
                        $('#id_goods_pks').val('');
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
            $('#btnDelete').removeClass('disabled');
            return false; // avoid to execute the actual submit of the form.
        },

        // 选中全部
        selectAll:function () {
            $('.list_selector').prop('checked', $('#checkSelectAll').prop('checked'));
            this.toggleCommandButtonStatus();
        },

        // 选择框变更状态
        selectorChanged:function () {
            this.toggleCommandButtonStatus();
            $('#checkSelectAll').prop('checked', $('.list_selector').length === $('.list_selector:checked').length);
        },

        // 一览前置选择框状态变化使用
        toggleCommandButtonStatus:function () {
            if ($('#btnDelete')) {
                var selectedNumToBeDeleted = $('.list_selector:checked').length;
                $('#btnDelete').prop('disabled', selectedNumToBeDeleted === 0);
                if (selectedNumToBeDeleted !== 0) {
                    $('#btnDelete').removeClass('disabled');
                } else {
                    $('#btnDelete').addClass('disabled');
                }
            }
        },

        onloadstartHandler: function() {
            $('#uploadFileContainer .uploadScence2').show();

            var progressbar = $("#progressbar"),
                progressLabel = $(".progress-label");
            progressbar.progressbar({
                value: false,
                max: 100,
                change: function() {
                    progressLabel.text(parseInt(progressbar.progressbar("option", "value"), 10) + "%" );
                },
                complete: function() {
                    progressLabel.text( "Complete!" );
                }
            });
        },

        onprogressHandler: function(event) {
            $("#progressbar").progressbar("option", "value",  event.loaded * 100 / event.total);
        },

        // 测试是否兼容XMLHttpRequest Level2
        supportAjaxUploadWithProgress: function() {
            return supportFileAPI() && supportAjaxUploadProgressEvents() && supportFormData();

            // Is the File API supported?
            function supportFileAPI() {
                var fi = document.createElement('INPUT');
                fi.type = 'file';
                return 'files' in fi;
            }

            // Are progress events supported?
            function supportAjaxUploadProgressEvents() {
                var xhr = new XMLHttpRequest();
                return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
            }

            // Is FormData supported?
            function supportFormData() {
                return !! window.FormData;
            }
        }
    });
});