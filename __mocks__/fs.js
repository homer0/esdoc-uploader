'use strict';

// __mocks__/fs.js

// Get the automatic mock for `fs`
const fsMock = jest.genMockFromModule('fs');

let fileContent = null;

function __setReponse(content) {
    if (typeof content !== 'string') {
        content = JSON.stringify(content);
    }

    fileContent = content;
}

function readFileSync() {
    return fileContent;
}

// Override the default behavior of the `readFileSync` mock
fsMock.readFileSync.mockImplementation(readFileSync);

// Add a custom method to the mock
fsMock.__setReponse = __setReponse;

module.exports = fsMock;
