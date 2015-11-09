#!/usr/bin/env node
'use strict';

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var uploader = new _index2.default();
if (uploader.canUpload()) {
    uploader.upload();
}