/*
 * Copyright (c) 2012 Camille Reynders
 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */

/*jshint node:true*/

module.exports = function (grunt) {
  "use strict";

  // Nodejs libs.
  var fs = require('fs');
  var path = require('path');

  // External libs.
  var Tempfile = require('temporary/lib/file');

  var status;
  var errorReporting = false;

  // Handle methods passed from PhantomJS, including Jasmine hooks.
  var phantomHandlers = {
    begin        : function () {},
    testDone     : function (totalAssertions, passedAssertions, failedAssertions, skippedAssertions) {
      status.specs++;
      status.failed += failedAssertions;
      status.passed += passedAssertions;
      status.total += totalAssertions;
      status.skipped += skippedAssertions;
    },
    done : function (elapsed) {
      status.duration = elapsed;
    },
    file        : function (type,filename, xml) {
      if (type === 'junit') {
        grunt.file.mkdir('output');
        grunt.file.write('output/' + filename, xml);
      }
    },
    write : function(str) {
      grunt.log.write.apply(grunt.log,arguments);
    },
    writeln : function(str) {
      grunt.log.writeln.apply(grunt.log,arguments);
    },
    error        : function(string) {
      grunt.log.writeln(string.red);
    },
    done_fail    : function (url) {
      grunt.verbose.write('Running PhantomJS...').or.write('...');
      grunt.log.error();
      grunt.warn('PhantomJS unable to load "' + url + '" URI.', 90);
    },
    done_timeout : function () {
      grunt.log.writeln();
      grunt.warn('PhantomJS timed out, possibly due to an unfinished async spec.', 90);
    },
    console      : console.log.bind(console),
    debug        : grunt.log.debug.bind(grunt.log, 'phantomjs')
  };

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('jasmine', 'Run Jasmine specs in a headless PhantomJS instance.', function () {
    var timeout = grunt.config(['jasmine', this.target, 'timeout']);
    if (typeof timeout === "undefined") {
      timeout = 10000;
    }

    errorReporting = !!grunt.config(['jasmine', this.target, 'errorReporting']);

    var urls = grunt.file.expandFileURLs(this.file.src);

    // This task is asynchronous.
    var done = this.async();

    // Reset status.
    status = {failed : 0, passed : 0, total : 0, skipped : 0, specs : 0, duration : 0};

    // Process each filepath in-order.
    grunt.utils.async.forEachSeries(urls, function (url, next) {
      var basename = path.basename(url);
      grunt.verbose.subhead('Running specs for ' + basename).or.write('Running specs for ' + basename);
      grunt.log.writeln();

      // Create temporary file to be used for grunt-phantom communication.
      var tempfile = new Tempfile();
      var timeoutId;
      var linesRead = 0;

      function cleanup() {
        clearTimeout(timeoutId);
        tempfile.unlink();
      }

      // As Jasmine tests, assertions and modules begin and complete,
      // the results are written as JSON to a temporary file. This polling loop
      // checks that file for new lines, and for each one parses its JSON and
      // executes the corresponding method with the specified arguments.
      (function communicationLoop() {

        grunt.log.muted = true;
        var lines = grunt.file.read(tempfile.path).split('\n').slice(0, -1);
        grunt.log.muted = false;

        // Iterate over all lines that haven't already been processed.
        var done = lines.slice(linesRead).some(function (line) {
          var args = JSON.parse(line);
          var method = args.shift();

          if (phantomHandlers[method]) phantomHandlers[method].apply(null, args);

          // return true and stop iterating if method starts with done
          return (/^done/).test(method);
        });

        if (done) {
          grunt.log.writeln();
          cleanup();
          next();
        } else {
          linesRead = lines.length;
          timeoutId = setTimeout(communicationLoop, 100);
        }
      }());

      grunt.helper('phantomjs', {
        code : 90,
        args : [
          '--config=' + grunt.task.getFile('jasmine/phantom-config.json'),

          grunt.task.getFile('jasmine/phantom-jasmine-runner.js'),

          tempfile.path,    // The temporary file used for communication.
          url,              // URL to the Jasmine .html test file to run.
          timeout,          // timeout before failure

          // Helper files
          grunt.task.getFile('jasmine/phantom-helper.js'),
          grunt.task.getFile('jasmine/reporters/ConsoleReporter.js'),
          grunt.task.getFile('jasmine/reporters/JUnitReporter.js'),
          grunt.task.getFile('jasmine/jasmine-helper.js')
        ],
        done : function (err) {
          if (err) {
            cleanup();
            done();
          }
        }
      });
    }, function (err) {
      // All tests have been run.
      // Log results.
      if (status.failed > 0) {
        grunt.warn(status.failed + '/' + status.total + ' assertions failed in ' + status.specs + ' specs.', Math.min(99, 90 + status.failed));
      } else if (status.skipped > 0) {
        grunt.warn(status.skipped + '/' + status.total + ' assertions skipped in ' + status.specs + ' specs.', Math.min(99, 90 + status.skipped));
      } else {
        grunt.verbose.writeln();
        grunt.log.ok(status.total + ' assertions passed in ' + status.specs + ' specs.');
      }

      done();
    });
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  grunt.registerHelper('phantomjs', function (options) {
    return grunt.utils.spawn({ cmd : 'phantomjs', args : options.args }, function (err, result, code) {
      if (!err) {
        return options.done(null);
      }
      // Something went horribly wrong.
      grunt.verbose.or.writeln();
      grunt.log.write('Running PhantomJS...').error();
      if (code === 127) {
        grunt.log.errorlns(
          'In order for this task to work properly, PhantomJS must be ' +
            'installed and in the system PATH (if you can run "phantomjs" at' +
            ' the command line, this task should work). Unfortunately, ' +
            'PhantomJS cannot be installed automatically via npm or grunt. ' +
            'See the grunt FAQ for PhantomJS installation instructions: ' +
            'https://github.com/cowboy/grunt/blob/master/docs/faq.md'
        );
        grunt.warn('PhantomJS not found.', options.code);
      } else {
        result.split('\n').forEach(grunt.log.error, grunt.log);
        grunt.warn('PhantomJS exited unexpectedly with exit code ' + code + '.', options.code);
      }
      options.done(code);
    });
  });

};
