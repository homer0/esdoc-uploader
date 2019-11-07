#!/usr/bin/env node

// esdoc-uploader: CLI interface

const ESDocUploader = require('./index');
// Instantiate an object that will detect the url from your package.json
const uploader = new ESDocUploader();
// Checks if the url on your package.json is valid
if (uploader.canUpload()) {
  // Start uploading the docs
  uploader.upload();
}
