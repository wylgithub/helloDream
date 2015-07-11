define([
    'require',
    'jquery',
    'backbone',
    'jqueryuiprogressbar'
], function (require, $, Backbone) {
    "use strict";

    return Backbone.View.extend({
        el: '#uploadFileContainer',

        events: {
            'change #uploadFile': 'onUploadFileChanged',
            'click #btnUpload': 'onUploadFileClicked'
        },

        onUploadFileClicked: function() {
            $('#uploadFile').trigger('click');
        },

        onUploadFileChanged: function() {
            if (!this.supportAjaxUploadWithProgress()) {
                return false;
            }

            var formData = new FormData();
            formData.append('articleId', 111119999);
            formData.append('csrfmiddlewaretoken', $('input[name=csrfmiddlewaretoken]').first().val());
            formData.append('uploadFile', $('#uploadFile')[0].files[0]);

            // Get an XMLHttpRequest instance
            var xhr = new XMLHttpRequest();
            var __view = this;
            // Set up events
            xhr.upload.addEventListener('loadstart', this.onloadstartHandler, false);
            xhr.upload.addEventListener('progress', this.onprogressHandler, false);
//            xhr.upload.addEventListener('load', this.onloadHandler, false);
            xhr.addEventListener('readystatechange', function(event) {
                var status = null,
                    state = null;

                try {
                    status = event.target.status;
                    state = event.target.readyState;
                }
                catch(e) {
                    return;
                }

                if (state === 4 && status === 200 && event.target.responseText) {
                    $('#uploadFileContainer .uploadScence2').hide();
                    $('#uploadFileContainer .uploadScence1').show();
                    $('#uploadFileContainer #uploadFile').replaceWith('<input type="file" name="uploadFile" id="uploadFile"/>');
                    $("#progressbar").progressbar( "destroy" );
                    if (__view) {
                        __view.trigger('fileUploaded', $.parseJSON(event.target.responseText));
                    }
                }
            }, false);

            // Set up request
            xhr.open('POST', '/upyun/upload/', true);

            // Fire!
            xhr.send(formData);
        },

        initialize:function(parentView) {
            if (!this.supportAjaxUploadWithProgress()) {
                window.alert('您的浏览器不支持上传功能，请安装使用最新的浏览器，IE sucks!');
                $('#uploadFile').attr('disabled', true);
            }else {
                if (parentView) {
                    this._parentView = parentView;
                }
            }
        },

        onloadstartHandler: function() {
            $('#uploadFileContainer .uploadScence1').hide();
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