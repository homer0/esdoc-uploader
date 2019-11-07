/* eslint-disable no-console */
jest.unmock('/src/index');
jest.mock('fs');
jest.mock('https');

require('jasmine-expect');
const path = require('path');
const fs = require('fs');
const https = require('https');
const ESDocUploader = require('/src/index');

const originalConsoleLog = console.log;
const originalClearLine = process.stdout.clearLine;
const originalCursorTo = process.stdout.cursorTo;
const originalWrite = process.stdout.write;

describe('ESDocUploader', () => {
  beforeEach(() => {
    fs.readFileSync.mockReset();
    https.request.mockReset();
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it('should be instantiated and have public methods', () => {
    // Given
    const url = 'git@github.com:homer0/projext.git';
    let sut = null;
    // When
    sut = new ESDocUploader(url);
    // Then
    expect(sut).toBeInstanceOf(ESDocUploader);
    expect(sut.canUpload).toBeFunction();
    expect(sut.upload).toBeFunction();
  });

  it('should allow uploads when instantiated with a valid URL', () => {
    // Given
    const url = 'git@github.com:homer0/wootils.git';
    let sut = null;
    let result = null;
    let resultUrl = null;
    // When
    sut = new ESDocUploader(url);
    result = sut.canUpload();
    resultUrl = sut.url;
    // Then
    expect(result).toBeTrue();
    expect(resultUrl).toBe(url);
    expect(console.log).toHaveBeenCalledTimes(0);
  });

  it('should log an error when instantiated with an invalid URL', () => {
    // Given
    const url = 'git:homer0/jimpex.git';
    let sut = null;
    let result = null;
    let resultUrl = null;
    // When
    sut = new ESDocUploader(url);
    result = sut.canUpload();
    resultUrl = sut.url;
    // Then
    expect(result).toBeFalse();
    expect(resultUrl).toBeNull();
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'The repository url is invalid'
    );
  });

  it('should retrieve the package.json repository when instantiated without a url', () => {
    // Given
    const url = 'homer0/parserror';
    const packageContents = {
      repository: url,
    };
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(packageContents));
    let sut = null;
    let result = null;
    let resultUrl = null;
    // When
    sut = new ESDocUploader();
    result = sut.canUpload();
    resultUrl = sut.url;
    // Then
    expect(result).toBeTrue();
    expect(resultUrl).toBe(`git@github.com:${url}.git`);
    expect(console.log).toHaveBeenCalledTimes(0);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('./package.json'), 'utf-8');
  });

  it('should support an object as repository information from the package.json', () => {
    // Given
    const url = 'homer0/parserror.git';
    const packageContents = {
      repository: {
        type: 'git',
        url: `github.com/${url}`,
      },
    };
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify(packageContents));
    let sut = null;
    let result = null;
    let resultUrl = null;
    // When
    sut = new ESDocUploader();
    result = sut.canUpload();
    resultUrl = sut.url;
    // Then
    expect(result).toBeTrue();
    expect(resultUrl).toBe(`git@github.com:${url}`);
    expect(console.log).toHaveBeenCalledTimes(0);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('./package.json'), 'utf-8');
  });

  it('should log an error if the package.json can\'t be read', () => {
    // Given
    fs.readFileSync.mockImplementationOnce(() => {
      throw new Error();
    });
    let sut = null;
    let result = null;
    let resultUrl = null;
    // When
    sut = new ESDocUploader();
    result = sut.canUpload();
    resultUrl = sut.url;
    // Then
    expect(result).toBeFalse();
    expect(resultUrl).toBeNull();
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('./package.json'), 'utf-8');
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'There\'s no package.json in this directory'
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'The repository url is invalid. There is likely additional logging output above'
    );
  });

  it('should log an error if the package.json doesn\'t have a repository property', () => {
    // Given
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify({}));
    let sut = null;
    let result = null;
    let resultUrl = null;
    // When
    sut = new ESDocUploader();
    result = sut.canUpload();
    resultUrl = sut.url;
    // Then
    expect(result).toBeFalse();
    expect(resultUrl).toBeNull();
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('./package.json'), 'utf-8');
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'There\'s no repository information in the package.json'
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'The repository url is invalid. There is likely additional logging output above'
    );
  });

  it('should log an error if the package.json repository url is invalid', () => {
    // Given
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify({
      repository: 'some/invalid/url',
    }));
    let sut = null;
    let result = null;
    let resultUrl = null;
    // When
    sut = new ESDocUploader();
    result = sut.canUpload();
    resultUrl = sut.url;
    // Then
    expect(result).toBeFalse();
    expect(resultUrl).toBeNull();
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('./package.json'), 'utf-8');
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'The repository from the package.json it\'s not valid. Expected format ' +
        '"[author]/[repository]"'
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'The repository url is invalid. There is likely additional logging output above'
    );
  });

  it('should log an error if the package.json repository object is not for git', () => {
    // Given
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify({
      repository: {
        type: 'svn',
      },
    }));
    let sut = null;
    let result = null;
    let resultUrl = null;
    // When
    sut = new ESDocUploader();
    result = sut.canUpload();
    resultUrl = sut.url;
    // Then
    expect(result).toBeFalse();
    expect(resultUrl).toBeNull();
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('./package.json'), 'utf-8');
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'ESDoc only supports Github repositories'
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'The repository url is invalid. There is likely additional logging output above'
    );
  });

  it('should log an error if the package.json repository object is not for Github', () => {
    // Given
    fs.readFileSync.mockImplementationOnce(() => JSON.stringify({
      repository: {
        type: 'git',
        url: 'gitlab...',
      },
    }));
    let sut = null;
    let result = null;
    let resultUrl = null;
    // When
    sut = new ESDocUploader();
    result = sut.canUpload();
    resultUrl = sut.url;
    // Then
    expect(result).toBeFalse();
    expect(resultUrl).toBeNull();
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('./package.json'), 'utf-8');
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'ESDoc only supports Github repositories'
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Date),
      'The repository url is invalid. There is likely additional logging output above'
    );
  });

  describe('upload', () => {
    const mockStdout = () => {
      process.stdout.clearLine = jest.fn();
      process.stdout.cursorTo = jest.fn();
      process.stdout.write = jest.fn();
    };

    const unmockStdout = () => {
      process.stdout.clearLine = originalClearLine;
      process.stdout.cursorTo = originalCursorTo;
      process.stdout.write = originalWrite;
    };

    beforeEach(() => {
      mockStdout();
      setTimeout.mockReset();
      setInterval.mockReset();
    });

    afterEach(() => {
      console.log.mockReset();
    });

    it('should upload a documentation', () => {
      // Given
      const request = {
        write: jest.fn(),
        end: jest.fn(),
      };
      const response = {
        statusCode: 200,
        on: jest.fn(),
      };
      // - Post
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      // - Get
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      const url = 'git@github.com:homer0/wootils.git';
      const successPath = '/some-success-path';
      const postResponseCode = Buffer.from(JSON.stringify({
        success: true,
        path: successPath,
      }));
      const getResponseCode = Buffer.from(JSON.stringify({
        success: true,
      }));
      const {
        clearLine,
        cursorTo,
        write,
      } = process.stdout;
      const callback = jest.fn();
      let sut = null;
      let onPostData = null;
      let onPostEnd = null;
      let timeoutBeforeGet = null;
      let intervalIndicator = null;
      let onGetData = null;
      let onGetEnd = null;
      const expectedBody = JSON.stringify({ gitUrl: url });
      const expectedPath = `https://doc.esdoc.org${successPath}`;
      const expectedIndicatorText = 'Uploading';
      const expectedIndicatorDots = ['', '.', '..', '...', '..', '.', ''];
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      ([[intervalIndicator]] = setInterval.mock.calls);
      expectedIndicatorDots.forEach(() => intervalIndicator());
      ([[, onPostData],, [, onPostEnd]] = response.on.mock.calls);
      onPostData(postResponseCode);
      onPostEnd();
      ([[timeoutBeforeGet]] = setTimeout.mock.calls);
      timeoutBeforeGet();
      ([,,, [, onGetData],, [, onGetEnd]] = response.on.mock.calls);
      onGetData(getResponseCode);
      onGetEnd();
      unmockStdout();
      // Then
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(true, expectedPath);
      expect(https.request).toHaveBeenCalledTimes(2);
      expect(https.request).toHaveBeenCalledWith(
        {
          hostname: 'doc.esdoc.org',
          path: '/api/create',
          port: 443,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': expectedBody.length,
          },
        },
        expect.any(Function)
      );
      expect(https.request).toHaveBeenCalledWith(
        {
          hostname: 'doc.esdoc.org',
          path: `${successPath}/.finish.json`,
          port: 443,
          method: 'GET',
        },
        expect.any(Function)
      );
      expect(request.write).toHaveBeenCalledTimes(1);
      expect(request.write).toHaveBeenCalledWith(expectedBody);
      expect(request.end).toHaveBeenCalledTimes(2);
      expect(response.on).toHaveBeenCalledTimes(6);
      expect(response.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        `The documentation was successfully uploaded: ${expectedPath}`
      );
      expect(clearLine).toHaveBeenCalledTimes(expectedIndicatorDots.length + 1);
      expect(cursorTo).toHaveBeenCalledTimes(expectedIndicatorDots.length + 1);
      expect(write).toHaveBeenCalledTimes(expectedIndicatorDots.length);
      expectedIndicatorDots.forEach((dot) => {
        expect(write).toHaveBeenCalledWith(`${expectedIndicatorText}${dot}`);
      });
    });

    it('should continuously check until the documentation is uploaded', () => {
      // Given
      const request = {
        write: jest.fn(),
        end: jest.fn(),
      };
      const response = {
        statusCode: 200,
        on: jest.fn(),
      };
      // - Post
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      // - Get
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      // First get
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      const url = 'git@github.com:homer0/projext.git';
      const successPath = '/some-success-path';
      const postResponseCode = Buffer.from(JSON.stringify({
        success: true,
        path: successPath,
      }));
      const firstGetResponseCode = Buffer.from('<html>');
      const secondGetResponseCode = Buffer.from(JSON.stringify({
        success: true,
      }));
      const callback = jest.fn();
      let sut = null;
      let onPostData = null;
      let onPostEnd = null;
      let firstTimeoutBeforeGet = null;
      let secondTimeoutBeforeGet = null;
      let onFirstGetData = null;
      let onFirstGetEnd = null;
      let onSecondGetData = null;
      let onSecondGetEnd = null;
      const expectedBody = JSON.stringify({ gitUrl: url });
      const expectedPath = `https://doc.esdoc.org${successPath}`;
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      ([[, onPostData],, [, onPostEnd]] = response.on.mock.calls);
      onPostData(postResponseCode);
      onPostEnd();
      ([[firstTimeoutBeforeGet]] = setTimeout.mock.calls);
      firstTimeoutBeforeGet();
      ([,,, [, onFirstGetData],, [, onFirstGetEnd]] = response.on.mock.calls);
      onFirstGetData(firstGetResponseCode);
      onFirstGetEnd();
      ([, [secondTimeoutBeforeGet]] = setTimeout.mock.calls);
      secondTimeoutBeforeGet();
      ([,,,,,, [, onSecondGetData],, [, onSecondGetEnd]] = response.on.mock.calls);
      onSecondGetData(secondGetResponseCode);
      onSecondGetEnd();
      unmockStdout();
      // Then
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(true, expectedPath);
      expect(https.request).toHaveBeenCalledTimes(3);
      expect(https.request).toHaveBeenCalledWith(
        {
          hostname: 'doc.esdoc.org',
          path: '/api/create',
          port: 443,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': expectedBody.length,
          },
        },
        expect.any(Function)
      );
      expect(https.request).toHaveBeenCalledWith(
        {
          hostname: 'doc.esdoc.org',
          path: `${successPath}/.finish.json`,
          port: 443,
          method: 'GET',
        },
        expect.any(Function)
      );
      expect(https.request).toHaveBeenCalledWith(
        {
          hostname: 'doc.esdoc.org',
          path: `${successPath}/.finish.json`,
          port: 443,
          method: 'GET',
        },
        expect.any(Function)
      );
      expect(request.write).toHaveBeenCalledTimes(1);
      expect(request.write).toHaveBeenCalledWith(expectedBody);
      expect(request.end).toHaveBeenCalledTimes(3);
      expect(response.on).toHaveBeenCalledTimes(9);
      expect(response.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        `The documentation was successfully uploaded: ${expectedPath}`
      );
    });

    it('should continuously check until the documentation is uploaded (error)', () => {
      // Given
      const request = {
        write: jest.fn(),
        end: jest.fn(),
      };
      const response = {
        statusCode: 200,
        on: jest.fn(),
      };
      const errorResponse = {
        statusCode: 400,
        on: jest.fn(),
      };
      // - Post
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      // - Get
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(errorResponse);
        return request;
      });
      // First get
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      const url = 'git@github.com:homer0/projext.git';
      const successPath = '/some-success-path';
      const postResponseCode = Buffer.from(JSON.stringify({
        success: true,
        path: successPath,
      }));
      const firstGetResponseCode = Buffer.from(JSON.stringify({
        success: false,
      }));
      const secondGetResponseCode = Buffer.from(JSON.stringify({
        success: true,
      }));
      const callback = jest.fn();
      let sut = null;
      let onPostData = null;
      let onPostEnd = null;
      let firstTimeoutBeforeGet = null;
      let secondTimeoutBeforeGet = null;
      let onFirstGetData = null;
      let onFirstGetEnd = null;
      let onSecondGetData = null;
      let onSecondGetEnd = null;
      const expectedBody = JSON.stringify({ gitUrl: url });
      const expectedPath = `https://doc.esdoc.org${successPath}`;
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      ([[, onPostData],, [, onPostEnd]] = response.on.mock.calls);
      onPostData(postResponseCode);
      onPostEnd();
      ([[firstTimeoutBeforeGet]] = setTimeout.mock.calls);
      firstTimeoutBeforeGet();
      ([[, onFirstGetData],, [, onFirstGetEnd]] = errorResponse.on.mock.calls);
      onFirstGetData(firstGetResponseCode);
      onFirstGetEnd();
      ([, [secondTimeoutBeforeGet]] = setTimeout.mock.calls);
      secondTimeoutBeforeGet();
      ([,,, [, onSecondGetData],, [, onSecondGetEnd]] = response.on.mock.calls);
      onSecondGetData(secondGetResponseCode);
      onSecondGetEnd();
      unmockStdout();
      // Then
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(true, expectedPath);
      expect(https.request).toHaveBeenCalledTimes(3);
      expect(https.request).toHaveBeenCalledWith(
        {
          hostname: 'doc.esdoc.org',
          path: '/api/create',
          port: 443,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': expectedBody.length,
          },
        },
        expect.any(Function)
      );
      expect(https.request).toHaveBeenCalledWith(
        {
          hostname: 'doc.esdoc.org',
          path: `${successPath}/.finish.json`,
          port: 443,
          method: 'GET',
        },
        expect.any(Function)
      );
      expect(https.request).toHaveBeenCalledWith(
        {
          hostname: 'doc.esdoc.org',
          path: `${successPath}/.finish.json`,
          port: 443,
          method: 'GET',
        },
        expect.any(Function)
      );
      expect(request.write).toHaveBeenCalledTimes(1);
      expect(request.write).toHaveBeenCalledWith(expectedBody);
      expect(request.end).toHaveBeenCalledTimes(3);
      expect(response.on).toHaveBeenCalledTimes(6);
      expect(response.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(response.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(errorResponse.on).toHaveBeenCalledTimes(3);
      expect(errorResponse.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(errorResponse.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(errorResponse.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        `The documentation was successfully uploaded: ${expectedPath}`
      );
    });

    it('should log an error when trying to trigger a second upload', () => {
      // Given
      const request = {
        write: jest.fn(),
        end: jest.fn(),
      };
      const response = {
        statusCode: 200,
        on: jest.fn(),
      };
      // - Post
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      // - Get
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      const url = 'git@github.com:homer0/wootils.git';
      const successPath = '/some-success-path';
      const postResponseCode = Buffer.from(JSON.stringify({
        success: true,
        path: successPath,
      }));
      const getResponseCode = Buffer.from(JSON.stringify({
        success: true,
      }));
      const callback = jest.fn();
      let sut = null;
      let onPostData = null;
      let onPostEnd = null;
      let timeoutBeforeGet = null;
      let onGetData = null;
      let onGetEnd = null;
      const expectedPath = `https://doc.esdoc.org${successPath}`;
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      sut.upload();
      ([[, onPostData],, [, onPostEnd]] = response.on.mock.calls);
      onPostData(postResponseCode);
      onPostEnd();
      ([[timeoutBeforeGet]] = setTimeout.mock.calls);
      timeoutBeforeGet();
      ([,,, [, onGetData],, [, onGetEnd]] = response.on.mock.calls);
      onGetData(getResponseCode);
      onGetEnd();
      unmockStdout();
      // Then
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(false);
      expect(callback).toHaveBeenCalledWith(true, expectedPath);
      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        'The documentation is already being uploaded'
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        `The documentation was successfully uploaded: ${expectedPath}`
      );
    });

    it('should log an error when trying to upload with an invalid url', () => {
      // Given
      unmockStdout();
      const url = 'invalid-url';
      const callback = jest.fn();
      let sut = null;
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      // Then
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(false);
      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        'The repository url is invalid'
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        'The repository url is invalid'
      );
    });

    it('should log an error when the first request fails', () => {
      // Given
      const request = {
        write: jest.fn(),
        end: jest.fn(),
      };
      const response = {
        statusCode: 200,
        on: jest.fn(),
      };
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      const url = 'git@github.com:homer0/wootils.git';
      const callback = jest.fn();
      const error = new Error('Damn');
      let sut = null;
      let onPostError = null;
      let onPostEnd = null;
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      ([, [, onPostError], [, onPostEnd]] = response.on.mock.calls);
      onPostError(error);
      onPostEnd();
      unmockStdout();
      // Then
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(false);
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        error.message
      );
    });

    it('should log an error when the first request fails due to an error response', () => {
      // Given
      const request = {
        write: jest.fn(),
        end: jest.fn(),
      };
      const response = {
        statusCode: 200,
        on: jest.fn(),
      };
      // - Post
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      const url = 'git@github.com:homer0/wootils.git';
      const error = 'daaaamn';
      const postResponseCode = Buffer.from(JSON.stringify({
        success: false,
        message: error,
      }));
      const callback = jest.fn();
      let sut = null;
      let onPostData = null;
      let onPostEnd = null;
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      ([[, onPostData],, [, onPostEnd]] = response.on.mock.calls);
      onPostData(postResponseCode);
      onPostEnd();
      // Then
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(false);
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        error
      );
    });

    it('should log an error when the first request fails due to an unexpected response', () => {
      // Given
      const request = {
        write: jest.fn(),
        end: jest.fn(),
      };
      const response = {
        statusCode: 200,
        on: jest.fn(),
      };
      // - Post
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      const url = 'git@github.com:homer0/wootils.git';
      const postResponseCode = Buffer.from('{}');
      const callback = jest.fn();
      let sut = null;
      let onPostData = null;
      let onPostEnd = null;
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      ([[, onPostData],, [, onPostEnd]] = response.on.mock.calls);
      onPostData(postResponseCode);
      onPostEnd();
      // Then
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(false);
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        'Unexpected error, please try again'
      );
    });

    it('should log an error when the second request fails', () => {
      // Given
      const request = {
        write: jest.fn(),
        end: jest.fn(),
      };
      const response = {
        statusCode: 200,
        on: jest.fn(),
      };
      // - Post
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      // - Get
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      const url = 'git@github.com:homer0/wootils.git';
      const successPath = '/some-success-path';
      const postResponseCode = Buffer.from(JSON.stringify({
        success: true,
        path: successPath,
      }));
      const error = 'something went wrong!';
      const getResponseCode = Buffer.from(JSON.stringify({
        message: error,
      }));
      const callback = jest.fn();
      let sut = null;
      let onPostData = null;
      let onPostEnd = null;
      let timeoutBeforeGet = null;
      let onGetData = null;
      let onGetEnd = null;
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      ([[, onPostData],, [, onPostEnd]] = response.on.mock.calls);
      onPostData(postResponseCode);
      onPostEnd();
      ([[timeoutBeforeGet]] = setTimeout.mock.calls);
      timeoutBeforeGet();
      ([,,, [, onGetData],, [, onGetEnd]] = response.on.mock.calls);
      onGetData(getResponseCode);
      onGetEnd();
      unmockStdout();
      // Then
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(false);
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        error
      );
    });

    it('should log an error when the second request fails with an unexpected error', () => {
      // Given
      const request = {
        write: jest.fn(),
        end: jest.fn(),
      };
      const response = {
        statusCode: 200,
        on: jest.fn(),
      };
      // - Post
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      // - Get
      https.request.mockImplementationOnce((_, resCallback) => {
        resCallback(response);
        return request;
      });
      const url = 'git@github.com:homer0/wootils.git';
      const successPath = '/some-success-path';
      const postResponseCode = Buffer.from(JSON.stringify({
        success: true,
        path: successPath,
      }));
      const getResponseCode = Buffer.from('{}');
      const callback = jest.fn();
      let sut = null;
      let onPostData = null;
      let onPostEnd = null;
      let timeoutBeforeGet = null;
      let onGetData = null;
      let onGetEnd = null;
      // When
      sut = new ESDocUploader(url);
      sut.upload(callback);
      ([[, onPostData],, [, onPostEnd]] = response.on.mock.calls);
      onPostData(postResponseCode);
      onPostEnd();
      ([[timeoutBeforeGet]] = setTimeout.mock.calls);
      timeoutBeforeGet();
      ([,,, [, onGetData],, [, onGetEnd]] = response.on.mock.calls);
      onGetData(getResponseCode);
      onGetEnd();
      unmockStdout();
      // Then
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(false);
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Date),
        'Unexpected error, please try again'
      );
    });
  });
});
