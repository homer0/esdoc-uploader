#!/usr/bin/env node
'use strict';

// esdoc-uploader: CLI interface

// Import the module's main class
import ESDocUploader from './index';
// Instantiate an object that will detect the url from your package.json
const uploader = new ESDocUploader();
// Checks if the url on your package.json is valid
if (uploader.canUpload()) {
    // Start uploading the docs
    uploader.upload();
}
