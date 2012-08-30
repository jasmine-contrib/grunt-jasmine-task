/*
 * Copyright (c) 2012 Camille Reynders
 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */

/*jshint node:true*/


module.exports = function (grunt) {
  "use strict";

  var phantomjs = require('./lib/phantomjs').init(grunt);
  // Nodejs libs.
  var fs = require('fs');
  var path = require('path');

  // External libs.
  var Tempfile = require('temporary/lib/file');

  var status;
  var errorReporting = false;

  phantomjs.on('jasmine.begin',function(){

  });

  phantomjs.on('jasmine.testDone',function(totalAssertions, passedAssertions, failedAssertions, skippedAssertions){
    status.specs++;
    status.failed += failedAssertions;
    status.passed += passedAssertions;
    status.total += totalAssertions;
    status.skipped += skippedAssertions;
  });

  phantomjs.on('jasmine.done',function(elapsed){
    phantomjs.halt();
    status.duration = elapsed;
  });

  phantomjs.on('jasmine.done.ConsoleReporter',function(elapsed){
    phantomjs.emit('jasmine.done');
  });

  phantomjs.on('file',function(type,filename, xml){
    if (type === 'junit') {
      grunt.file.mkdir('output');
      grunt.file.write('output/' + filename, xml);
    }
  });

  phantomjs.on('jasmine.done_fail',function(url){
    grunt.verbose.write('Running PhantomJS...').or.write('...');
    grunt.log.error();
    grunt.warn('PhantomJS unable to load "' + url + '" URI.', 90);
  });
  phantomjs.on('fail.timeout',function(){
    grunt.log.writeln();
    grunt.warn('PhantomJS timed out, possibly due to an unfinished async spec.', 90);
  });
  phantomjs.on('console',console.log.bind(console));
  phantomjs.on('debug',grunt.log.debug.bind(grunt.log, 'phantomjs'));
  phantomjs.on('write', grunt.log.write.bind(grunt.log));
  phantomjs.on('writeln', grunt.log.writeln.bind(grunt.log));
  phantomjs.on('error',function(string){
    grunt.log.writeln(string.red);
  });

  false && phantomjs.on('*',function(){
    grunt.log.writeln("Event : ".yellow);
    grunt.log.debug(Array.prototype.slice.call(arguments));
    grunt.log.writeln("----".yellow);
  });
  phantomjs.on('jasmine.',function(){});

  phantomjs.on('jasmine.*', function() {
    var args = [this.event].concat(grunt.util.toArray(arguments));
    // grunt 0.4.0
    // grunt.event.emit.apply(grunt.event, args);
  });

  // ==========================================================================
  // TASKS
  // ==========================================================================

  var defaultOptions = {
    timeout: 10000,
    inject: [
      grunt.task.getFile('jasmine/phantom-helper.js'),
      grunt.task.getFile('jasmine/reporters/ConsoleReporter.js'),
      grunt.task.getFile('jasmine/reporters/JUnitReporter.js'),
      grunt.task.getFile('jasmine/jasmine-helper.js')
    ],
    '--config': grunt.task.getFile('lib/phantomjs/phantom-config.json')
  };

  // delete for 0.4.0
  grunt.util = grunt.utils;

  grunt.registerMultiTask('jasmine', 'Run jasmineunit tests in a headless PhantomJS instance.', function() {
    var options = grunt.config(['jasmine', this.target]);
    // Merge task-specific and/or target-specific options with these defaults.
    options = grunt.util._.extend({},defaultOptions,options);
    var _options = false && this.options(defaultOptions);

    var urls = grunt.file.expandFileURLs(this.file.src);

    var done = this.async();

    status = {failed: 0, passed: 0, total: 0, duration: 0};

    // Process each filepath in-order.
    grunt.util.async.forEachSeries(urls, function(url, next) {
        var basename = path.basename(url);
        grunt.verbose.subhead('Testing ' + basename).or.write('Testing ' + basename);

        // Launch PhantomJS.
        phantomjs.spawn(url, {
          // Exit code to use if PhantomJS fails in an uncatchable way.
          failCode: 90,
          options: options,
          done: function(err) {
            if (err) return done();
            next();
          }
        });
      },
      function(err) {
        if (status.failed > 0) {
          grunt.warn(status.failed + '/' + status.total + ' assertions failed (' +
            status.duration + 'ms)', Math.min(99, 90 + status.failed));
        } else {
          grunt.verbose.writeln();
          grunt.log.ok(status.total + ' assertions passed (' + status.duration + 'ms)');
        }
        // All done!
        done();
      });
  });
};
