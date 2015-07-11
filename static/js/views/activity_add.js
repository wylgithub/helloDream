define([
    'require',
    'jquery',
    'backbone',
    'datepicker',
    'datetimepicker',
    'datetimepickerCN',
    'jqueryuiprogressbar',
    'wysi1',
    'wysi2',
    'wysi3'
], function (require, $, Backbone) {
    "use strict";

    var AppView = Backbone.View.extend({
        el:"body",
        in_syncing:false,  //防止两重提交标志位
        upload_image_index:-1,  // 上传图片index
        delete_image_index:-1,  // 上传图片index

        events:{
            'click .dropdownItem':'dropdownItem_click',
            'click #btnNext':'next_click',
            'click #btnReturn':'return_to_prev_page',
            'change #uploadFile': 'onUploadFileChanged',
            'click .btn-upload': 'onUploadFileClicked',
            'click .btn-delete': 'onDeleteFileClicked',
            'click .btn-delete-image-confirm': 'onDeleteConfirm'
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

            var formData = new FormData();
            var activityId = -1;
            formData.append('csrfmiddlewaretoken', $('input[name=csrfmiddlewaretoken]').first().val());
            formData.append('uploadFile', $('#uploadFile')[0].files[0]);
            formData.append('imageType', 'activity');
            formData.append('imageIndex', this.upload_image_index);
            formData.append('activityId', activityId);

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

                if (status === 404) {return;}

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
                        $('#uploadFileContainer #image_flg' + imageIndex).val("True");
                        $('[data-upload-index="' + imageIndex + '"]').replaceWith(
                            '<div id="image-group' + imageIndex + '">' +
                            '<button type="button" class="btn btn-danger btn-mini btn-delete" data-delete-index="' + imageIndex + '" ' +
                            'data-toggle="modal" href="#delete-image-confirm" data-show="true">' +
                            '<i class="icon-trash icon-white"></i> 删除</button>' +
                            '<a href="javascript: void(0);" class="thumbnail"><img src="' + $.parseJSON(event.target.responseText).image_url + '" alt=""></a>' +
                            '</div>'
                        );

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

            var formData = new FormData();
            var activity_id = -1;
            formData.append('csrfmiddlewaretoken', $('input[name=csrfmiddlewaretoken]').first().val());
            formData.append('imageType', 'activity');
            formData.append('imageId', $('#image_id' + index).val());
            formData.append('imageIndex', index);
            formData.append('activityId', activity_id);

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

                if (status === 404) {return;}

                if (readyState === 4 && status === 200 && event.target.responseText) {
                    if ($.parseJSON(event.target.responseText).error_code > 0) {
                        window.alert($.parseJSON(event.target.responseText).error_msg);
                    }else {
                        deleteIndex = __view.delete_image_index;
                        $('#uploadFileContainer .uploadScence2').hide();
                        $('#uploadFileContainer #image_id' + deleteIndex).val("");
                        $('#uploadFileContainer #image_flg' + deleteIndex).val("False");
                        $('#uploadFileContainer #image-group' + deleteIndex).replaceWith(
                            '<button type="button" class="btn btn-primary btn-mini btn-upload" data-upload-index="' + deleteIndex + '"><i class="icon-upload icon-white"></i> 上传</button>'
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

        initialize:function() {
            $('#id_start_date').datepicker().on('changeDate', function(event) {
                $(event.target).datepicker('hide');
            });
            $('#id_end_date').datepicker().on('changeDate', function(event) {
                $(event.target).datepicker('hide');
            });

            $('#btnNext').popover({
                placement: "top",
                trigger: "hover",
                title: "提示",
                delay: {show:1000, hide:100},
                content: "保存活动信息。"
            });

            $(document).ready(function() {
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

        // 下一步
        next_click:function() {
            //防止两重提交
            if (this.in_syncing) {
                return;
            }
            this.in_syncing = true;
            $('#btnNext').prop('disabled', true);

            $('#frmAddActivity').submit();
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
    return AppView;
});