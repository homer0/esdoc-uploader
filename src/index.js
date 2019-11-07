const https = require('https');
const fs = require('fs');
const path = require('path');
/**
 * @typedef {Function} UploadCallback
 * @param {Boolean} success Whether the documentation was uploaded or not.
 * @param {?String} url     The url for the documentation.
 */

/**
 * @typedef {Function} RequestCallback
 * @param {?Error} error    In case the request fails.
 * @param {String} response The request response.
 * @param {Number} status   The response status code.
 * @ignore
 */

/**
* ESDocUploader, connects with the [ESDoc hosting service](https://doc.esdoc.org/) API in order
* to generage the documentation for your project.
*/
class ESDocUploader {
  /**
   * @param {?String} [url=null] This is the GitHub repository url. The required format its
   *                             `git[at]github.com:[author]/[repository].git`. You can also
   *                             ignore it and it will automatically search for it on your
   *                             `package.json`.
   */
  constructor(url = null) {
    /**
     * A list of pre defined messages that the class will log.
     * @type {Object}
     * @protected
     * @ignore
     */
    this._messages = {
      invalidUrl: 'The repository url is invalid',
      invalidPackageUrl: 'The repository url is invalid. ' +
        'There is likely additional logging output above',
      uploading: 'The documentation is already being uploaded',
      unexpected: 'Unexpected error, please try again',
      noPackage: 'There\'s no package.json in this directory',
      noRepository: 'There\'s no repository information in the package.json',
      invalidFormat: 'The repository from the package.json it\'s not valid. ' +
      'Expected format "[author]/[repository]"',
      onlyGithub: 'ESDoc only supports Github repositories',
      success: 'The documentation was successfully uploaded:',
    };
    /**
     * The repository url. It can be `null` if the one provided via the parameter is invalid or
     * if a valid one can't be retrieved from the `package.json`.
     * @type {?String}
     * @protected
     * @ignore
     */
    this._url = url === null ? this._retrieveUrlFromPackage() : this._validateUrl(url);
    /**
     * A flag to know if the class it's currently uploading the documentation or not.
     * @type {Boolean}
     * @protected
     * @ignore
     */
    this._uploading = false;
    /**
     * A small dictionary used to store information relative to the ESDoc API, like it's
     * main hostname and the path to create a new documentation.
     * When a new documentation is created, this object will be updated with the path
     * to check if the documentation is ready.
     * @type {Object}
     * @protected
     * @ignore
     */
    this._api = {
      host: 'doc.esdoc.org',
      create: '/api/create',
    };
    /**
     * The name of the file where the class it's going to check if the docs were uploaded. The
     * complete path is created with the information from the response the class gets when a
     * new documentation is created.
     * @type {String}
     * @protected
     * @ignore
     */
    this._finishFile = '/.finish.json';
    /**
     * The interval time the class will use in order to check if an uploaded documentation
     * is available or not.
     * @type {Number}
     * @protected
     * @ignore
     */
    this._intervalTime = 4000;
    /**
     * A callback that will be executed after getting a confirmation that the documentation
     * was successfully updated. It's value is set using the `upload` method.
     * @type {?UploadCallback}
     * @protected
     * @ignore
     */
    this._callback = null;
    /**
     * The text that will show up on the console.
     * @type {String}
     * @protected
     * @ignore
     */
    this._indicatorText = 'Uploading';
    /**
     * The amout of time in which the indicator will be updated.
     * @type {Number}
     * @protected
     * @ignore
     */
    this._indicatorInterval = 1000;
    /**
     * A utility counter to know how many dots will be added to the indicator.
     * @type {Number}
     * @protected
     * @ignore
     */
    this._indicatorCounter = -1;
    /**
     * After this many iterations, the dots in the indicator will start to be removed instead
     * of being added. When the counter hits 0, it will start adding again, until it
     * hits this limit.
     * @type {Number}
     * @protected
     * @ignore
     */
    this._indicatorLimit = 3;
    /**
     * A flag to know if the indicator it's currently adding dots or removing them.
     * @type {Boolean}
     * @protected
     * @ignore
     */
    this._indicatorIncrease = true;
    /**
     * @ignore
     */
    this._ask = this._ask.bind(this);
    /**
     * @ignore
     */
    this._runIndicator = this._runIndicator.bind(this);
  }
  /**
   * Checks whether the repository is valid and the class can start uploading the documentation.
   * @return {Boolean}
   */
  canUpload() {
    return !!this._url;
  }
  /**
   * Upload your documentation to the ESDoc API.
   * @param {UploadCallback} callback An optional callback to be executed after everthing
   *                                  is ready.
   */
  upload(callback) {
    if (this._url === null) {
      this._callback = callback;
      this._logError('invalidUrl');
    } else if (this._uploading) {
      this._logError('uploading');
    } else {
      this._callback = callback;
      this._uploading = true;
      this._startIndicator();
      this._postRequest(
        'create',
        { gitUrl: this._url },
        (error, response) => {
          if (error) {
            this._logError(error);
          } else {
            const useResponse = JSON.parse(response);
            if (useResponse.success) {
              this._setAPIPath('path', useResponse.path);
              this._setAPIPath(
                'status',
                `${useResponse.path}${this._finishFile}`
              );
              this._startAsking();
            } else {
              this._logError(useResponse.message || 'unexpected');
            }
          }
        }
      );
    }
  }
  /**
   * The repository url the class will send to the ESDoc API.
   * @type {?String}
   */
  get url() {
    return this._url;
  }
  /**
   * Tries to retrieve the repository url from the project's `pacakge.json`.
   * @return {String}
   * @protected
   * @ignore
   */
  _retrieveUrlFromPackage() {
    const packagePath = path.resolve('./package.json');
    let packageContents;
    try {
      packageContents = fs.readFileSync(packagePath, 'utf-8');
    } catch (ignore) {
      // This is ignored because we already have the error going out if there's no package.
    }
    let result = null;
    if (packageContents) {
      const authorAndRepoParts = 2;
      const property = JSON.parse(packageContents).repository;
      if (!property) {
        this._logError('noRepository');
      } else if (typeof property === 'string') {
        const urlParts = property.split('/');
        if (urlParts.length !== authorAndRepoParts) {
          this._logError('invalidFormat');
        } else {
          result = this._buildUrl(urlParts[0], urlParts[1]);
        }
      } else if (property.type !== 'git' || !property.url.match(/github/)) {
        this._logError('onlyGithub');
      } else {
        const urlParts = property.url.split('/');
        const author = urlParts[urlParts.length - authorAndRepoParts];
        const repository = urlParts[urlParts.length - 1];
        result = this._buildUrl(author, repository);
      }
    } else {
      this._logError('noPackage');
    }

    if (result === null) {
      this._logError('invalidPackageUrl');
    }

    return result;
  }
  /**
   * Generates a new url with the required format to use with the ESDoc API.
   * @param {String} author     The GitHub username.
   * @param {String} repository The repository name.
   * @return {String}
   * @protected
   * @ignore
   */
  _buildUrl(author, repository) {
    const extension = '.git';
    const useRepository = repository.includes(extension) ?
      repository.substr(0, repository.length - extension.length) :
      repository;

    return `git@github.com:${author}/${useRepository}.git`;
  }
  /**
   * Validates a given url to see if it has the required format by the ESDoc API.
   * @param {String} url - The url to validate.
   * @return {?String} If the url it's valid, it will return it, otherwise, it will
   *                   return `null`.
   * @protected
   * @ignore
   */
  _validateUrl(url) {
    let result = null;
    if (url.match(/^git@github\.com:[\w\d._-]+\/[\w\d._-]+\.git$/)) {
      result = url;
    } else {
      this._logError('invalidUrl');
    }

    return result;
  }
  /**
   * This method is called after the initial request to the API, and tells the class to check
   * every X milliseconds to see if the documentation was uploaded.
   * @protected
   * @ignore
   */
  _startAsking() {
    setTimeout(this._ask, this._intervalTime);
  }
  /**
   * It makes a request to check if the documentation was uploaded or not. If is not ready, it
   * will call `_startAsking` to setup a new check; otherwise, it will invoke the callback sent
   * to `upload`.
   * @protected
   * @ignore
   */
  _ask() {
    this._getRequest('status', (error, response) => {
      if (error || response.includes('<html>')) {
        this._startAsking();
      } else {
        const useResponse = JSON.parse(response);
        if (useResponse.success) {
          this._finish();
        } else {
          this._logError(useResponse.message || 'unexpected');
        }
      }
    });
  }
  /**
   * This method is called after it's confirmed that the documentation was successfully uploaded,
   * it stops the indicator, logs a message with the url for the documetation and invokes the
   * callback set in the `upload()` method.
   * @protected
   * @ignore
   */
  _finish() {
    this._uploading = false;
    this._stopIndicator();
    const url = this._getAPIUrl('path');
    // eslint-disable-next-line no-console
    console.log(
      '\x1b[30m[%s] \x1b[32m%s\x1b[0m',
      new Date(),
      `${this._messages.success} ${url}`
    );
    this._callback(true, url);
  }
  /**
   * Returns a complete url for the ESDoc API.
   * @param  {String} apiPath The reference name for the path the request is for,
   *                          inside the `_api` dictionary.
   * @protected
   * @ignore
   */
  _getAPIUrl(apiPath) {
    const usePath = this._api[apiPath];
    return `https://${this._api.host}${usePath}`;
  }
  /**
   * Makes a POST request to the API.
   * @param {String}          apiPath   The reference name for the path the request is for,
   *                                    inside the `_api` dictionary.
   * @param {Object}          body      The body of the request.
   * @param {RequestCallback} callback  The callback to be invoked when the request is finished.
   * @protected
   * @ignore
   */
  _postRequest(apiPath, body, callback) {
    const data = JSON.stringify(body);
    const options = {
      hostname: this._api.host,
      path: this._api[apiPath],
      port: 443,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };
    const req = this._createAPIRequest(options, callback);
    req.write(data);
    req.end();
  }
  /**
   * Makes a GET request to the API.
   * @param {String}          apiPath   The reference name for the path the request is for,
   *                                    inside the `_api` dictionary.
   * @param {RequestCallback} callback  The callback to be invoked when the request is finished.
   * @protected
   * @ignore
   */
  _getRequest(apiPath, callback) {
    const options = {
      hostname: this._api.host,
      path: this._api[apiPath],
      port: 443,
      method: 'GET',
    };
    const req = this._createAPIRequest(options, callback);
    req.end();
  }
  /**
   * A wrapper on top of `https.request` that allows the class to make requests, setup the
   * listeners and resolve everything on a single callback.
   * @param {Object}           reqOptions  The options for `https.request`.
   * @param {RequestCallback}  callback    The callback to be invoked when the request is
   *                                       finished.
   * @protected
   * @ignore
   */
  _createAPIRequest(reqOptions, callback) {
    return https.request(reqOptions, (res) => {
      const { statusCode } = res;
      const chunks = [];
      let errored = false;
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('error', (error) => {
        errored = true;
        callback(error, null, statusCode);
      });
      res.on('end', () => {
        if (!errored) {
          const response = Buffer.concat(chunks).toString();
          const badRequest = 400;
          if (statusCode >= badRequest) {
            callback(
              new Error(`The API responded with a ${statusCode}`),
              response,
              statusCode
            );
          } else {
            callback(null, response, statusCode);
          }
        }
      });
    });
  }
  /**
   * Sets a new path reference to be used with the ESDoc API.
   * After triggering the upload, this will be used to store the path the API uses so the class
   * can check if the documentation is available.
   * @param {String} name    A reference identifier for the path.
   * @param {String} apiPath The relative path you want to save.
   * @protected
   * @ignore
   */
  _setAPIPath(name, apiPath) {
    this._api[name] = apiPath;
  }
  /**
   * Logs an eror message to the terminal and, if `upload` was ever call, it invokes the callback
   * informing that the operation wasn't successful.
   * @param {String|Error} error The message to log, a key for the `_messages` dictionary or
   *                             an `Error` object.
   * @protected
   * @ignore
   */
  _logError(error) {
    let useError;
    if (typeof error === 'string') {
      useError = this._messages[error] || error;
    } else {
      useError = error.message;
    }
    // eslint-disable-next-line no-console
    console.log('\x1b[30m[%s] \x1b[31m%s\x1b[0m', new Date(), useError);
    this._stopIndicator(false);
    if (this._callback) {
      this._callback(false);
    }
  }
  /**
   * Starts showing the progress indicator on the terminal.
   * @protected
   * @ignore
   */
  _startIndicator() {
    const indicatorIntervalTime = 500;
    this._indicatorInterval = setInterval(
      this._runIndicator,
      indicatorIntervalTime
    );
  }
  /**
   * The actual method that shows the progress indicator on the terminal.
   * @protected
   * @ignore
   */
  _runIndicator() {
    let text = this._indicatorText;
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

    for (let i = 0; i < this._indicatorCounter; i++) {
      text += '.';
    }

    this._restartLine();
    this._print(text);
  }
  /**
   * Removes the progress indicator from the terminal.
   * @protected
   * @ignore
   */
  _stopIndicator() {
    clearInterval(this._indicatorInterval);
    this._restartLine();
  }
  /**
   * Removes everything on the current terminal line and sets the cursor to the initial
   * position.
   * @protected
   * @ignore
   */
  _restartLine() {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
  }
  /**
   * Writes a message in the terminal.
   * @param {String} message - The text to write.
   * @protected
   * @ignore
   */
  _print(message) {
    process.stdout.write(message);
  }
}

module.exports = ESDocUploader;
