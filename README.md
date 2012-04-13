# grunt-jasmine-task v0.1.1

Grunt task for running jasmine specs.
Status: stable

## Getting Started
Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started] with: `npm install grunt-jasmine-task`

Then add this line to your project's `grunt.js` gruntfile at the bottom:

```javascript
grunt.loadNpmTasks('grunt-jasmine-task');
```

also add this to the grunt.initConfig object in the same file:

```javascript
jasmine: {
  index: ['specs/index.html']
},
```

now you can run the jasmine task with:

```grunt jasmine```


[grunt]: https://github.com/cowboy/grunt
[getting_started]: https://github.com/cowboy/grunt/blob/master/docs/getting_started.md

## Documentation
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History
_(Nothing yet)_

## License
Copyright (c) 2012 Camille Reynders  
Licensed under the MIT license.
