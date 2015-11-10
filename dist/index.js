'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _logUtil = require('log-util');

var _logUtil2 = _interopRequireDefault(_logUtil);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * ESDocUploader, connects with the [ESDoc hosting service](https://doc.esdoc.org/) API in order
 * to generage the documentation for your project.
 * @version  1.0.0
 */

var ESDocUploader = (function () {
    /**
     * Create a new instance of the uploader.
     * @param  {String} [url=null] - This is the GitHub repository url. The required format its
     *                               `git@github.com:[author]/[repository].git`. You can also
     *                               ignore it and it will automatically search for it on your
     *                               `package.json`.
     * @public
     */

    function ESDocUploader() {
        _classCallCheck(this, ESDocUploader);

        var url = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

        /**
         * A list of pre defined messages that the class will log.
         * @type {Object}
         * @private
         * @ignore
         */
        this._messages = {
            constructor: 'The repository url is invalid. ' + 'There is likely additional logging output above',
            invalidUrl: 'The repository url is invalid. You can\'t upload anything',
            uploading: 'The documentation is already being uploaded',
            unexpected: 'Unexpected error, please try again',
            noPackage: 'There\'s no package.json in this directory',
            noRepository: 'There\'s no repository information in the package.json',
            invalidFormat: 'The repository from the package.json it\'s not valid. ' + 'Expected format "[author]/[repository]"',
            onlyGitHub: 'ESDoc only supports GitHub repositories',
            success: 'The documentation was successfully uploaded:'
        };

        if (url === null) {
            url = this._retrieveUrlFromPackage();
        } else {
            url = this._validateUrl(url);
        }
        /**
         * The repository url. It can be null if the one provided is not valid or if there isn't
         * one on the `package.json`.
         * @type {string|null}
         * @private
         * @ignore
         */
        this.url = url;
        /**
         * A flag to know if the class it's currently uploading something.
         * @type {Boolean}
         * @private
         * @ignore
         */
        this._uploading = false;
        /**
         * A small dictionary used to store information relative to the ESDoc API, like it's
         * main domain or the path to create a new doc.
         * @type {Object}
         * @private
         * @ignore
         */
        this._api = {
            domain: 'https://doc.esdoc.org',
            create: '/api/create'
        };
        /**
         * The name of the file where the class it's going to check if the docs were uploaded.
         * @type {String}
         * @private
         * @ignore
         */
        this._finishFile = '/.finish.json';
        /**
         * The amount of time the class will wait between checks to see if the docs site was
         * generated.
         * @type {Number}
         * @private
         * @ignore
         */
        this._intervalTime = 4000;
        /**
         * After the first request, this is where the returned path for the docs on the server
         * will be stored.
         * @type {String}
         * @private
         * @ignore
         */
        this._path = '';
        /**
         * A callback that will be executed after confirmation that the docs were generated.
         * @type {Function}
         * @private
         * @ignore
         */
        this._callback = null;
        /**
         * The text that will show up on the terminal.
         * @type {String}
         * @private
         * @ignore
         */
        this._indicatorText = 'Uploading';
        /**
         * The amout of time in which the indicator will be updated.
         * @type {Number}
         * @private
         * @ignore
         */
        this._indicatorInterval = 1000;
        /**
         * A utility counter to know how many dos will be added to the indicator
         * @type {Number}
         * @private
         * @ignore
         */
        this._indicatorCounter = -1;
        /**
         * After this many iterations, the dots will start to be removed instead of added. When the
         * counter hits 0, it will start adding again, until it hits this limit.
         * @type {Number}
         * @private
         * @ignore
         */
        this._indicatorLimit = 3;
        /**
         * A flag to know if the indicator it's currently adding dots or removing them.
         * @type {Boolean}
         * @private
         * @ignore
         */
        this._indicatorIncrease = true;
        /**
         * If there's no url, log the error message.
         */
        if (this.url === null) {
            this._logError('constructor');
        }
    }
    /**
     * After the class is istantiated, this method can be used to check if the url is valid and
     * if the method `upload` can be called
     * @public
     */

    _createClass(ESDocUploader, [{
        key: 'canUpload',
        value: function canUpload() {
            return this.url !== null;
        }
        /**
         * Upload your documentation to the ESDoc API.
         * @param  {Function} [callback=() => {}] - An optional callback to be executed after
         * everthing is ready.
         * @public
         */

    }, {
        key: 'upload',
        value: function upload() {
            var _this = this;

            var callback = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

            if (this.url === null) {
                this._callback = callback;
                this._logError('invalidUrl');
            } else if (this._uploading) {
                this._logError('uploading');
            } else {
                this._callback = callback;
                this._uploading = true;
                this._startIndicator();
                _request2.default.post({
                    url: this._getAPIUrl('create'),
                    body: { gitUrl: this.url },
                    json: true
                }, (function (err, httpResponse, body) {
                    if (err) {
                        _this._logError(err);
                    } else {
                        var response = body;
                        if (typeof response === 'string') {
                            response = JSON.parse(response);
                        }

                        if (!response.success) {
                            _this._logError(response.message || 'unexpected');
                        } else {
                            _this._setAPIUrl('path', response.path);
                            _this._setAPIUrl('status', response.path + _this._finishFile);
                            _this._startAsking();
                        }
                    }
                }).bind(this));
            }
        }
        /**
         * Tries to retrieve the repository url from your `pacakge.json`.
         * @return {String} The repository url that was on your `package.json`.
         * @private
         * @ignore
         */

    }, {
        key: '_retrieveUrlFromPackage',
        value: function _retrieveUrlFromPackage() {
            var packagePath = _path2.default.resolve('./package.json');
            var packageContents = _fs2.default.readFileSync(packagePath, 'utf-8');
            var result = null;
            if (!packageContents) {
                this._logError('noPackage');
            } else {
                var property = JSON.parse(packageContents).repository;
                if (!property) {
                    this._logError('noRepository');
                } else if (typeof property === 'string') {
                    var urlParts = property.split('/');
                    if (urlParts.length !== 2) {
                        this._logError('invalidFormat');
                    } else {
                        result = this._buildUrl(urlParts[0], urlParts[1]);
                    }
                } else {
                    if (property.type !== 'git' || !property.url.match(/github/)) {
                        this._logError('onlyGitHub');
                    } else {
                        var urlParts = property.url.split('/');
                        var author = urlParts[urlParts.length - 2];
                        var repository = urlParts[urlParts.length - 1];
                        result = this._buildUrl(author, repository);
                    }
                }
            }

            return result;
        }
        /**
         * Generates a new url with the required format to use with the ESDoc API.
         * @param  {String} author     - The GitHub username.
         * @param  {String} repository - The repository name.
         * @return {String} The new url, on the required format for ESDoc.
         * @private
         * @ignore
         */

    }, {
        key: '_buildUrl',
        value: function _buildUrl(author, repository) {
            if (repository.indexOf('.git') > -1) {
                repository = repository.substr(0, repository.length - 4);
            }

            return 'git@github.com:' + author + '/' + repository + '.git';
        }
        /**
         * Validates a given url to see if it has the required format by the ESDoc API.
         * @param  {String} url - The url to validate.
         * @return {String|null} If the url it's valid, it will return it, otherwise, itw will
         * return null.
         * @private
         * @ignore
         */

    }, {
        key: '_validateUrl',
        value: function _validateUrl(url) {
            var result = null;
            if (url.match(/^git@github\.com:[\w\d._-]+\/[\w\d._-]+\.git$/)) {
                result = url;
            }

            return result;
        }
        /**
         * This method is called after the initial request to the API, and tells the class to check
         * every X seconds to see if the documentation was uploaded.
         * @private
         * @ignore
         */

    }, {
        key: '_startAsking',
        value: function _startAsking() {
            setTimeout(this._ask.bind(this), this._intervalTime);
        }
        /**
         * It makes a request to check if the documentation was uploaded or not.
         * @private
         * @ignore
         */

    }, {
        key: '_ask',
        value: function _ask() {
            var _this2 = this;

            (0, _request2.default)(this._getAPIUrl('status'), (function (err, httpResponse, body) {
                if (err || body.indexOf('<html>') > -1) {
                    _this2._startAsking();
                } else {
                    var response = JSON.parse(body);
                    if (!response.success) {
                        _this2._logError(response.message || 'unexpected');
                    } else {
                        _this2._finish();
                    }
                }
            }).bind(this));
        }
        /**
         * This method is called after it's confirmed that the documentation was successfully uploaded,
         * and it stops teh indicator, logs a mesage with the url for the documetation and invokes the
         * callback set in the `upload()` method.
         * @private
         * @ignore
         */

    }, {
        key: '_finish',
        value: function _finish() {
            this._uploading = false;
            this._stopIndicator();
            var docUrl = this._getAPIUrl('path');
            _logUtil2.default.debug(this._messages.success + ' ' + docUrl);
            this._callback(true, docUrl);
        }
        /**
         * Returns a url for the ESDoc API.
         * @param  {String} type - The type of url you need. This is parameter it's the key for the
         *                         `_api` dictionary.
         * @return {String} It will return the API domain and the value in the `_api` dictionary for
         *                  given type.
         * @private
         * @ignore
         */

    }, {
        key: '_getAPIUrl',
        value: function _getAPIUrl(type) {
            return this._api.domain + this._api[type];
        }
        /**
         * Set a new type of urlf or the ESDoc API. For example, the first request will return a
         * relative path for the documentation, this class will use this method to save this path
         * so it can be later be retrieved using `_getAPIUrl` and it wil already have the API main
         * domain.
         * @param {String} type - An identifier for your url.
         * @param {String} url  - The relative url you want to save.
         * @private
         * @ignore
         */

    }, {
        key: '_setAPIUrl',
        value: function _setAPIUrl(type, url) {
            this._api[type] = url;
        }
        /**
         * Logs an eror message to the terminal.
         * @param {String|Error} error - This can be the message you want to log, a key for the
         *                               `_messages` dictionary or an `Error` object.
         * @private
         * @ignore
         */

    }, {
        key: '_logError',
        value: function _logError(error) {
            if (typeof error === 'string') {
                if (this._messages[error]) {
                    error = this._messages[error];
                }
            } else {
                error = error.message;
            }

            _logUtil2.default.error(error);
            this._stopIndicator(false);
            if (this._callback) {
                this._callback(false);
            }
        }
        /**
         * Starts showing the progress indicator on the terminal.
         * @private
         * @ignore
         */

    }, {
        key: '_startIndicator',
        value: function _startIndicator() {
            this._indicatorInterval = setInterval(this._runIndicator.bind(this), 500);
        }
        /**
         * The actual method that shows the progress indicator on the terminal.
         * @private
         * @ignore
         */

    }, {
        key: '_runIndicator',
        value: function _runIndicator() {
            var text = this._indicatorText;
            if (this._indicatorIncrease) {
                this._indicatorCounter++;
                if (this._indicatorCounter === this._indicatorLimit) {
                    this._indicatorIncrease = false;
                }
            } else {
                this._indicatorCounter--;
                if (this._indicatorCounter === 0) {
                    this._indicatorIncrease = true;
                }
            }

            for (var i = 0; i < this._indicatorCounter; i++) {
                text += '.';
            }

            this._restartLine();
            this._print(text);
        }
        /**
         * Removes the progress indicator from the terminal.
         * @private
         * @ignore
         */

    }, {
        key: '_stopIndicator',
        value: function _stopIndicator() {
            clearInterval(this._indicatorInterval);
            this._restartLine();
        }
        /**
         * Removes everything on the current terminal line and sets the cursor to the initial
         * position.
         * @private
         * @ignore
         */

    }, {
        key: '_restartLine',
        value: function _restartLine() {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
        /**
         * Writes a message in the terminal.
         * @param {String} message - The text to write.
         * @private
         * @ignore
         */

    }, {
        key: '_print',
        value: function _print(message) {
            process.stdout.write(message);
        }
    }]);

    return ESDocUploader;
})();

exports.default = ESDocUploader;