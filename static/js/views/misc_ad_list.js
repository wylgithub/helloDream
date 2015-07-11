define([
    'require',
    'jquery',
    'backbone',
    'jqueryuiprogressbar'
], function (require, $, Backbone, ZeroClipboard) {
    "use strict";

    return Backbone.View.extend({
        el:"body",
        in_syncing:false,  //防止两重提交标志位
        upload_image_index:-1,  // 上传图片index
        delete_image_index:-1,  // 删除图片index

        events:{
            'change #uploadFile': 'onUploadFileChanged',
            'click .btn-upload': 'onUploadFileClicked',
            'click .btn-delete': 'onDeleteFileClicked',
            'click .btn-delete-image-confirm': 'onDeleteConfirm',
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
            formData.append('imageType', 'misc');
            formData.append('imageIndex', this.upload_image_index);
            formData.append('imageDescription', $('#description' + this.upload_image_index).val());
            formData.append('imageLink', $('#link_value' + this.upload_image_index).val());

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
                        $('[data-upload-index="' + imageIndex + '"]').replaceWith(
                            '<div id="image-group' + imageIndex + '">' +
                            '<button type="button" class="btn btn-danger btn-small btn-delete" data-delete-index="' + imageIndex + '" ' +
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
            this.options.parentView.trigger('start_ajax_sync');

            var formData = new FormData();
            formData.append('csrfmiddlewaretoken', $('input[name=csrfmiddlewaretoken]').first().val());
            formData.append('imageType', 'misc');
            formData.append('imageId', $('#image_id' + index).val());
            formData.append('imageIndex', index);

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
                        $('#description' + deleteIndex).val("");
                        $('#link_value' + deleteIndex).val("");
                        $('#uploadFileContainer #image_id' + deleteIndex).val("");
                        $('#uploadFileContainer #image-group' + deleteIndex).replaceWith(
                            '<button type="button" class="btn btn-primary btn-small btn-upload" data-upload-index="'
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

        initialize:function() {
            if (!this.supportAjaxUploadWithProgress()) {
                window.alert('您的浏览器不支持上传功能，请安装使用最新的浏览器!');
                $('#uploadFile').attr('disabled', true);
            };
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