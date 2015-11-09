# esdoc-uploader

A node module that connects with the [ESDoc hosting service](https://doc.esdoc.org/) API in order to generage the documentation for your project.

[![Build Status](https://travis-ci.org/homer0/esdoc-uploader.svg?branch=master)](https://travis-ci.org/homer0/esdoc-uploader) [![Coverage Status](https://coveralls.io/repos/homer0/esdoc-uploader/badge.svg?branch=master&service=github)](https://coveralls.io/github/homer0/esdoc-uploader?branch=master) [![Documentation Status](https://doc.esdoc.org/github.com/homer0/esdoc-uploader/badge.svg)](https://doc.esdoc.org/github.com/homer0/esdoc-uploader/) [![Dependencies status](https://david-dm.org/homer0/esdoc-uploader.svg)](https://david-dm.org/homer0/esdoc-uploader) [![Dev dependencies status](https://david-dm.org/homer0/esdoc-uploader/dev-status.svg)](https://david-dm.org/homer0/esdoc-uploader#info=devDependencies)

I've been using [ESDoc](https://esdoc.org) for a while now, and something great about it it's that they provide a [hosting service](https://doc.esdoc.org/) for you documentation. You only need to have your project hosted on GitHub and provide them with its url, the service will take care of cloning your repo, finding your `esdoc.json` file, generating the docs and publishing them, which I think it's pretty awesome!

Now, the only complication it's that every time you deploy a new change, you have to go to the page and submit a form with your repo url; but if you are working with **continuous integration**, doing that manually kind of kills the whole idea :P. and that's the reason of this project.

## Information

| -            | -                                                                |
|--------------|------------------------------------------------------------------|
| Package      | esdoc-uploader                                                   |
| Description  | Upload your ESDoc documentation to doc.esdoc.org                 |
| Node Version | >= v0.12.6 (You need >= v4.0.0 for the tests)                    |

## Installation

You can install it using [npm](https://www.npmjs.com/).

    npm install esdoc-uploader --save_dev
    
## Usage

### Command line

    $(npm bin)/esdoc-uploader
    
That's all, `esdoc-uploader` will automatically look up your `package.json`, get your repository information and start the process.

### As a module

```javascript
// Import the module class
var ESDocUploader = require('esdoc-uploader');

// Instantiate an object with a valid url
var uploader = new ESDocUploader('git@github.com:homer0/gulp-bundlerify.git');

// For extra precaution, check if the url is valid
if (uploader.canUpload()) {
    uploader.upload(function(success, url) {
        // Checks whether the process ended in success
        if (success) {
            // Logs a confirmation
            console.log('Documents uploaded to: ', url);
        } else {
            console.log('Something went wrong, check the errors above');
        }
    });
}
```

Pretty simple right? it only has three public methods:

- The `constructor`, which receives an already formatted GitHub url. Or you can ignore the argument and it will work like on the command line, looking for the information in your `package.json`.
- `canUpload()`: It checks if the upload process can be done or not.
- `upload()`: It starts uploading everything to the API. It receives a callback parameter, which will be called when the process finishes. The callback will receive two arguments: a `boolean` value to check if the process was successful, and in case it was, the url for where the documentation it's being hosted. 

## Development

### Install Git hooks

    ./hooks/install

### npm tasks

- `npm run build`: Generate a new build of the module.
- `npm test`: Run the module's unit tests.
- `npm run coverage`: Run the unit tests and open the coverage report on the browser.
- `npm run lint`: Lint the plugin's code with JSCS and ESLint.
- `npm run docs`: Generate the project documentation.

## License

MIT. [License file](./LICENSE).