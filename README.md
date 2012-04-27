[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md
[plugin_docs]: https://github.com/cowboy/grunt/blob/master/docs/plugins.md

# grunt-jasmine-task

Grunt task for running jasmine specs.

__Status: stable__

## Getting Started

__Install this grunt plugin__ next to your project's [grunt.js gruntfile][getting_started] with: `npm install grunt-jasmine-task`

(ie. the plugin is installed locally. If you want to install it globally - which is not recommended - check out the official [grunt documentation][plugin_docs])

__You also need to install the `temporary` module__

Although it is marked as a dependency in the `grunt-jasmine-task` module and automatically is installed together with the jasmine plugin, for some reason it cannot be found, therefore it needs to be installed separately, either as a global or local module.

To install it locally do:
`npm install temporary`

Then __add this line__ to your project's `grunt.js` gruntfile at the bottom:

```javascript
grunt.loadNpmTasks('grunt-jasmine-task');
```

Next you need to __create (a) target(s)__ for the jasmine task.

If you want to run one file just add this to the `grunt.initConfig` object 

```javascript
jasmine: {
  all: ['specs/specrunner.html']
},
```
Obviously you need to replace `specs/specrunner.html` with the location of your jasmine spec running html file.

__Since v0.2.0 you can also define a timeout.__ 
By default the task will fail after 10 seconds of inactivity, however you can override this if you want:

```javascript
jasmine: {
  all: {
    src:['specs/specrunner.html'],
    timeout: 20000 //in milliseconds
  }
},
```
This is useful for async assertions that may require more than 10 seconds to run.

Now you can run the jasmine task with:

```grunt jasmine```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. 
Add unit tests for any new or changed functionality. 
Lint and test your code using [grunt][grunt].

More info on creating grunt plugins

## Release History

* v0.2.0: added `timeout` configuration option
* v0.1.1: stable
* v0.1.0: broken

## License
Copyright (c) 2012 Camille Reynders  
Licensed under the MIT license.
