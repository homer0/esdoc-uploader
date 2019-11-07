# esdoc-uploader

A node module that connects with the [ESDoc hosting service](https://doc.esdoc.org/) API in order to generage the documentation for your project.

[![Travis](https://img.shields.io/travis/homer0/esdoc-uploader.svg?style=flat-square)](https://travis-ci.org/homer0/esdoc-uploader)
[![Coveralls github](https://img.shields.io/coveralls/github/homer0/esdoc-uploader.svg?style=flat-square)](https://coveralls.io/github/homer0/esdoc-uploader?branch=master)
[![David](https://img.shields.io/david/homer0/esdoc-uploader.svg?style=flat-square)](https://david-dm.org/homer0/esdoc-uploader)
[![David](https://img.shields.io/david/dev/homer0/esdoc-uploader.svg?style=flat-square)](https://david-dm.org/homer0/esdoc-uploader)

I've been using [ESDoc](https://esdoc.org) for a while now, and something great about it it's that they provide a [hosting service](https://doc.esdoc.org/) for your documentation. You only need to have your project hosted on GitHub and give them with its url, the service will take care of cloning your repo, finding your `esdoc.json` file, generating the docs and publishing them, which I think it's pretty awesome!

Now, the only complication it's that every time you deploy a new change, you have to go to the page and submit a form with your repo url; but if you are working with **continuous integration**, doing that manually kind of kills the whole idea :P... and that's the reason of this project.

> **Disclaimer (2019):** This project is still maintained, but there's no activity because the ESDoc hosting API doesn't have any other functionality, so no features will be added.
>
> If you are wondering why this project doesn't "use itself", it's because I no longer see the need to transpile Node code, and I can't use `esdoc-node` on the ESDoc hosting,
> so I'm using git pages.
>
> If you read the code... I know:
>
> 1. It should use promises.
> 2. It should separate the functionality on different modules.
> 3. I can use `node-fetch` or `axios` for the requests.
> 4. I can use `colors` or `chalk` for the log messages.
> 5. and so many more things...
>
> This project was one of my first npm packages, its scope is very limited, and when I updated it, I didn't want to completely rewrite it, just improve little details (what I could) while removing the need for production dependencies. 

## Information

| -            | -                                                                |
|--------------|------------------------------------------------------------------|
| Package      | esdoc-uploader                                                   |
| Description  | Upload your ESDoc documentation to doc.esdoc.org                 |
| Node Version | >= v8.10                                                         |

## Usage

### Command line

```bash
npx esdoc-uploader
# or
yarn esdoc-uploader
```
    
That's all, `esdoc-uploader` will automatically look up your `package.json`, get your repository information and start the process.

### As a module

```javascript
// Import the module class
var ESDocUploader = require('esdoc-uploader');

// Instantiate an object with a valid url
var uploader = new ESDocUploader('git@github.com:homer0/gulp-bundlerify.git');

// For extra precaution, check if the url is valid
if (uploader.canUpload()) {
  uploader.upload((success, url) => {
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

- The `constructor`, which receives an already formatted GitHub url. Or you can ignore the argument and it will work just like on the command line, looking for the information in your `package.json`.
- `canUpload()`: It checks if the upload process can be done or not.
- `upload()`: It starts uploading everything to the API. It receives a callback parameter, which will be called when the process finishes. The callback will then receive two arguments: a `boolean` value to check if the process was successful, and in case it was, the url for where the documentation it's being hosted. 

## Development

### NPM/Yarn tasks

| Task       | Description                         |
|------------|-------------------------------------|
| `test`     | Run the project unit tests.         |
| `lint`     | Lint the modified files.            |
| `lint:all` | Lint the entire project code.       |
| `docs`     | Generate the project documentation. |

### Repository hooks

I use [husky](https://yarnpkg.com/en/package/husky) to automatically install the repository hooks so the code will be tested and linted before any commit and the dependencies updated after every merge. The configuration is on the `husky` property of the `package.json` and the hooks' files are on `./utils/hooks`.

### Testing

I use [Jest](https://facebook.github.io/jest/) with [Jest-Ex](https://yarnpkg.com/en/package/jest-ex) to test the project. The configuration file is on `./.jestrc.json`, the tests are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Linting

I use [ESlint](http://eslint.org) with [my own custom configuration](http://yarnpkg.com/en/package/eslint-plugin-homer0) to validate all the JS code. The configuration file for the project code is on `./.eslintrc` and the one for the tests is on `./tests/.eslintrc`. There's also an `./.eslintignore` to exclude some files on the process. The script that runs it is on `./utils/scripts/lint`.

### Documentation

I use [ESDoc](http://esdoc.org) (:P) to generate HTML documentation for the project. The configuration file is on `./.esdoc.json` and the script that runs it is on `./utils/scripts/docs`.

## License

MIT. [License file](./LICENSE).
