require.config({
    shim: {
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        'ZeroClipboard': {
            exports: 'ZeroClipboard'
        },
        'jquery': {
            exports: '$'
        },
        'datepicker': {
            deps: ['bootstrap', 'jquery'],
            exports: 'datepicker'
        },
        'datetimepicker': {
            deps: ['bootstrap', 'jquery'],
            exports: 'datetimepicker'
        },
        'datetimepickerCN': {
            deps: ['datetimepicker'],
            exports: 'datetimepickerCN'
        },
        'jqueryuicore': {
            deps: ['jquery']
        },
        'jqueryuiwidget': {
            deps: ['jqueryuicore']
        },
        'jqueryuiprogressbar': {
            deps: ['jqueryuiwidget']
        },
        'wysi1': {
            deps: ['bootstrap', 'jquery'],
            exports: 'wysi1'
        },
        'wysi2': {
            deps: ['wysi1'],
            exports: 'wysi2'
        },
        'wysi3': {
            deps: ['wysi1', 'wysi2'],
            exports: 'wysi3'
        },
        'editable': {
            deps: ['bootstrap', 'jquery'],
            exports: 'editable'
        }
    },
    paths: {
        underscore: 'lib/underscore-min',
        backbone: 'lib/backbone-min',
        ZeroClipboard: 'lib/ZeroClipboard',
        bootstrap: 'lib/bootstrap-min',
        datepicker: 'lib/bootstrap-datepicker',
        datetimepicker: 'lib/bootstrap-datetimepicker',
        datetimepickerCN: 'lib/locales/bootstrap-datetimepicker.zh-CN',
        jqueryuicore: 'lib/jqueryui/core',
        jqueryuiwidget: 'lib/jqueryui/widget',
        jqueryuiprogressbar: 'lib/jqueryui/progressbar',
        cookie: 'lib/jquery.cookie',
        wysi1: 'lib/wysihtml5-0.3.0',
        wysi2: 'lib/bootstrap-wysihtml5',
        wysi3: 'lib/locales/bootstrap-wysihtml5.zh-CN',
        editable: 'lib/bootstrap-editable'
    }
});

require([
    'views/app',
    'csrf_ajax_fix',
    'bootstrap'
], function(AppView) {
    "use strict";
    // Constructors are functions that are designed to be used with the new prefix.
    // The new prefix creates a new object based on the function's prototype,
    // and binds that object to the function's implied this parameter.
    // If you neglect to use the new prefix, no new object will be made and this will be bound to the global object.
    // This is a serious mistake.
    // According to http://stackoverflow.com/questions/2381253/what-side-effects-does-the-keyword-new-have-in-javascript
    var app = new AppView();
});

