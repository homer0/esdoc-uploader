
jest.dontMock('../src/index.js');
jest.mock('fs');
let mockLogger;
let mockRequest;
let mockFs;
let ESDocUploader;
const dummyResponse = {
    success: true,
    path: '/ros/ario',
};
const dummyRepoUrl = 'git@github.com:homer0/gulp-bundlerify.git';
const dummyReportHttpUrl = 'http://github.com/homer0/gulp-bundlerify.git';

describe('esdoc-uploader', () => {

    beforeEach(() => {
        mockLogger = require('log-util');
        mockLogger.error.mockClear();
        mockLogger.debug.mockClear();
        jest.setMock('log-util', mockLogger);
        mockRequest = jest.genMockFunction();
        mockRequest.post = jest.genMockFunction();
        jest.setMock('request', mockRequest);
        mockFs = require('fs');
        jest.setMock('fs', mockFs);

        ESDocUploader = require('../src/index.js');
    });

    afterEach(() => {
        mockLogger = null;
        mockFs = null;
    });
    /**
     * @test {ESDocUploader#constructor}
     */
    it('should create a new instance and have public methods', () => {
        const instance = new ESDocUploader(dummyRepoUrl);
        expect(instance).toEqual(jasmine.any(ESDocUploader));
        expect(instance.canUpload).toEqual(jasmine.any(Function));
        expect(instance.upload).toEqual(jasmine.any(Function));

    });
    /**
     * @test {ESDocUploader#canUpload}
     */
    it('should return true from canUpload whe instantiated with a valid url', () => {
        const instance = new ESDocUploader(dummyRepoUrl);
        expect(instance.canUpload()).toBeTruthy();
    });
    /**
     * @test {ESDocUploader#constructor}
     */
    it('should log an error when instantiated with an invalid url', () => {
        const instance = new ESDocUploader('invalid-url');
        expect(mockLogger.error.mock.calls.length).toEqual(1);
        expect(mockLogger.error.mock.calls[0][0]).toEqual(instance._messages.constructor);
    });
    /**
     * @test {ESDocUploader#constructor}
     */
    it('should try to retrieve the url from the package.json', () => {

        const generatedUrl = dummyRepoUrl;

        // No package.json
        let instance = new ESDocUploader();
        expect(mockLogger.error.mock.calls.length).toEqual(2);
        expect(mockLogger.error.mock.calls[0][0]).toEqual(instance._messages.noPackage);
        expect(mockLogger.error.mock.calls[1][0]).toEqual(instance._messages.constructor);

        // No repository property on the package.json
        mockFs.__setReponse({});
        instance = new ESDocUploader();
        expect(mockLogger.error.mock.calls.length).toEqual(4);
        expect(mockLogger.error.mock.calls[2][0]).toEqual(instance._messages.noRepository);
        expect(mockLogger.error.mock.calls[3][0]).toEqual(instance._messages.constructor);

        // Repository as invalid string
        mockFs.__setReponse({
            repository: 'some/invalid/url',
        });
        instance = new ESDocUploader();
        expect(mockLogger.error.mock.calls.length).toEqual(6);
        expect(mockLogger.error.mock.calls[4][0]).toEqual(instance._messages.invalidFormat);
        expect(mockLogger.error.mock.calls[5][0]).toEqual(instance._messages.constructor);

        // Repository as a valid string
        mockFs.__setReponse({
            repository: 'homer0/gulp-bundlerify',
        });
        instance = new ESDocUploader();
        expect(mockLogger.error.mock.calls.length).toEqual(6);
        expect(instance.url).toEqual(generatedUrl);

        // Repository as an object, but from an unsupported type
        mockFs.__setReponse({
            repository: {
                type: 'svn',
            },
        });
        instance = new ESDocUploader();
        expect(mockLogger.error.mock.calls.length).toEqual(8);
        expect(mockLogger.error.mock.calls[4][0]).toEqual(instance._messages.invalidFormat);
        expect(mockLogger.error.mock.calls[5][0]).toEqual(instance._messages.constructor);

        // Repository as an object, but from an unsupported server
        mockFs.__setReponse({
            repository: {
                type: 'git',
                url: 'invalid-server',
            },
        });
        instance = new ESDocUploader();
        expect(mockLogger.error.mock.calls.length).toEqual(10);
        expect(mockLogger.error.mock.calls[6][0]).toEqual(instance._messages.onlyGitHub);
        expect(mockLogger.error.mock.calls[7][0]).toEqual(instance._messages.constructor);

        // Repository as an object with a url from github
        mockFs.__setReponse({
            repository: {
                type: 'git',
                url: dummyReportHttpUrl,
            },
        });
        instance = new ESDocUploader();
        expect(mockLogger.error.mock.calls.length).toEqual(10);
        expect(instance.url).toEqual(generatedUrl);

    });
    /**
     * @test {ESDocUploader#upload}
     */
    it('should try to upload the documentation', () => {

        // Invalid url
        let instance = new ESDocUploader('invlid-url');
        const mockCallback = jest.genMockFunction();
        expect(mockLogger.error.mock.calls.length).toEqual(1);
        expect(mockLogger.error.mock.calls[0][0]).toEqual(instance._messages.constructor);
        instance.upload(mockCallback);
        expect(mockLogger.error.mock.calls.length).toEqual(2);
        expect(mockLogger.error.mock.calls[1][0]).toEqual(instance._messages.invalidUrl);
        expect(mockCallback.mock.calls.length).toEqual(1);
        expect(mockCallback.mock.calls[0][0]).toBeFalsy();
        expect(mockCallback.mock.calls[0][1]).toBeUndefined();

        // Valid url and reponse with error
        instance = new ESDocUploader(dummyRepoUrl);
        instance.upload();
        expect(mockRequest.post.mock.calls.length).toEqual(1);
        let postCall = mockRequest.post.mock.calls[0];
        postCall[1](new Error('Random Error'));
        expect(mockLogger.error.mock.calls.length).toEqual(3);
        expect(mockLogger.error.mock.calls[2][0]).toEqual('Random Error');

        // Valid url, valid response but unsuccessful request
        instance = new ESDocUploader(dummyRepoUrl);
        instance.upload();
        expect(mockRequest.post.mock.calls.length).toEqual(2);
        postCall = mockRequest.post.mock.calls[1];
        postCall[1](null, {}, JSON.stringify({
            success: false,
            message: 'Random Error',
        }));
        expect(mockLogger.error.mock.calls.length).toEqual(4);
        expect(mockLogger.error.mock.calls[3][0]).toEqual('Random Error');

        // Valid url, valid response but unsuccessful request without a message
        instance = new ESDocUploader(dummyRepoUrl);
        instance.upload();
        expect(mockRequest.post.mock.calls.length).toEqual(3);
        postCall = mockRequest.post.mock.calls[2];
        postCall[1](null, {}, {success: false});
        expect(mockLogger.error.mock.calls.length).toEqual(5);
        expect(mockLogger.error.mock.calls[4][0]).toEqual(instance._messages.unexpected);

    });
    /**
     * @test {ESDocUploader#upload}
     */
    it('should successfully upload the documentation', () => {
        const dummyCallback = jest.genMockFunction();
        const instance = new ESDocUploader(dummyRepoUrl);
        instance.upload(dummyCallback);
        instance.upload();
        expect(mockLogger.error.mock.calls.length).toEqual(1);
        expect(mockLogger.error.mock.calls[0][0]).toEqual(instance._messages.uploading);
        expect(mockRequest.post.mock.calls.length).toEqual(1);
        const postCall = mockRequest.post.mock.calls[0];
        postCall[1](null, {}, dummyResponse);
        expect(setTimeout.mock.calls.length).toEqual(1);
        setTimeout.mock.calls[0][0]();
        const askCall = mockRequest.mock.calls[0][1];
        askCall(new Error('not yet'));
        expect(setTimeout.mock.calls.length).toEqual(2);
        askCall(null, {}, '<html>');
        expect(setTimeout.mock.calls.length).toEqual(3);
        askCall(null, {}, JSON.stringify({
            success: false,
            message: 'Random Error',
        }));
        expect(mockLogger.error.mock.calls.length).toEqual(2);
        expect(mockLogger.error.mock.calls[1][0]).toEqual('Random Error');
        askCall(null, {}, JSON.stringify({success: false}));
        expect(mockLogger.error.mock.calls.length).toEqual(3);
        expect(mockLogger.error.mock.calls[2][0]).toEqual(instance._messages.unexpected);
        askCall(null, {}, JSON.stringify({success: true}));
        expect(mockLogger.debug.mock.calls.length).toEqual(1);
        expect(mockLogger.debug.mock.calls[0][0]).toMatch(new RegExp(instance._messages.success));
        expect(dummyCallback.mock.calls.length).toEqual(4);
    });
    /**
     * @test {ESDocUploader#upload}
     */
    it('should write the loading indicator while it uploads the documentation', () => {
        const instance = new ESDocUploader(dummyRepoUrl);
        instance.upload();

        const originalClearLine = process.stdout.clearLine;
        process.stdout.clearLine = jasmine.createSpy('clearLine');
        const originalCursorTo = process.stdout.cursorTo;
        process.stdout.cursorTo = jasmine.createSpy('cursorTo');
        const originalWrite = process.stdout.write;
        process.stdout.write = jasmine.createSpy('write');

        const intervalCall = setInterval.mock.calls[0][0];
        const intervalText = 'Uploading';
        const intervalDots = ['', '.', '..', '...', '..', '.', ''];
        for (let i = 0; i < intervalDots.length; i++) {
            intervalCall();
            expect(process.stdout.clearLine).toHaveBeenCalled();
            expect(process.stdout.cursorTo).toHaveBeenCalledWith(0);
            expect(process.stdout.write).toHaveBeenCalledWith(intervalText + intervalDots[i]);
        }

        const postCall = mockRequest.post.mock.calls[0];
        postCall[1](null, {}, dummyResponse);

        setTimeout.mock.calls[0][0]();
        const askCall = mockRequest.mock.calls[0][1];
        askCall(null, {}, JSON.stringify({success: true}));
        expect(mockLogger.debug.mock.calls.length).toEqual(1);

        expect(clearInterval.mock.calls.length).toEqual(1);
        expect(process.stdout.clearLine).toHaveBeenCalled();
        expect(process.stdout.cursorTo).toHaveBeenCalledWith(0);

        process.stdout.clearLine = originalClearLine;
        process.stdout.cursorTo = originalCursorTo;
        process.stdout.write = originalWrite;
    });

});
