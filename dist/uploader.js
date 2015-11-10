#!/usr/bin/env node
'use strict'

// esdoc-uploader: CLI interface

// Import the module's main class
;

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Instantiate an object that will detect the url from your package.json
var uploader = new _index2.default();
// Checks if the url on your package.json is valid
if (uploader.canUpload()) {
    // Start uploading the docs
    uploader.upload();
}