/*
 * Copyright (c) 2012 Jarrod Overson
 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */

/*jshint node:true, curly:false*/
"use strict";

var fs = require('fs'),
    path = require('path'),
    connect = require('connect'),
    URL = require('url'),
    open = require('open');

var grunt, phantomjs;

var baseDir = '.';
var tmpRunner = '_SpecRunner.html';

var options, defaultOptions = {
  timeout : 10000,
  specs   : [],
  src     : [],
  helpers : [],
  phantomjs : {}
};


module.exports = function(g){
  grunt = g;
  grunt.util = grunt.utils;
  phantomjs = require('./lib/phantomjs').init(grunt);

  grunt.registerTask('jasmine', 'Run jasmine specs headlessly through PhantomJS.', function() {
    options = grunt.config('jasmine');

    var done = this.async();

    grunt.helper('jasmine-phantom-runner', options, function(err) {
      if (err) grunt.log.error(err);
      done(!err);
    });

  });

  // Convenience/test task. Never finishes and needs to be closes with ^C
  // Used to troubleshoot jasmine tasks outside of phantomjs
  grunt.registerTask('jasmine-server', 'Run jasmine specs headlessly through PhantomJS.', function() {
    var done   = this.async();
    grunt.helper('jasmine-interactive-runner', grunt.config('jasmine'));
  });

  grunt.registerHelper('jasmine-phantom-runner',function(options,cb){
    options = grunt.util._.extend({},defaultOptions,options);

    var phantomReporters = [
        grunt.task.getFile('jasmine/reporters/ConsoleReporter.js'),
        grunt.task.getFile('jasmine/reporters/JUnitReporter.js')
      ],
      port = (options.server && options.server.port) || 8888;

    var url = URL.format({
      protocol : 'http',
      hostname : '127.0.0.1',
      port : port + '',
      pathname : path.join(baseDir,tmpRunner)
    });

    grunt.verbose.subhead('Testing jasmine specs via phantom').or.writeln('Testing jasmine specs via phantom');
    grunt.helper('jasmine-build-specrunner', baseDir, options, phantomReporters);
    var server = grunt.helper('static-server', baseDir, port);

    runPhantom(url,options,phantomReporters.length,function(err,status){
      server.close();
      cb(err,status)
    });
  });

  grunt.registerHelper('jasmine-interactive-runner',function(options,cb){
    options = grunt.util._.extend({},defaultOptions,options);

    var port = (options.server && options.server.port) || 8888;

    var url = URL.format({
      protocol : 'http',
      hostname : '127.0.0.1',
      port : port + '',
      pathname : path.join(baseDir,tmpRunner)
    });

    grunt.helper('jasmine-build-specrunner', baseDir, options, []);
    grunt.helper('static-server', baseDir, port);
    open(url)
    cb();
  });

  grunt.registerHelper('jasmine-build-specrunner', function(dir, options, reporters){
    var jasmineCss = [
      __dirname + '/../jasmine/lib/jasmine-core/jasmine.css'
    ];

    var jasmineCore = [
      __dirname + '/../jasmine/lib/jasmine-core/jasmine.js',
      __dirname + '/../jasmine/lib/jasmine-core/jasmine-html.js'
    ];

    var phantomHelper = __dirname + '/jasmine/phantom-helper.js';
    var jasmineHelper = __dirname + '/jasmine/jasmine-helper.js';

    var styles = getRelativeFileList(jasmineCss);
    var scripts = getRelativeFileList(jasmineCore, options.src, options.helpers, options.specs, phantomHelper, reporters, jasmineHelper);

    var specRunnerTemplate = __dirname + '/../jasmine/SpecRunner.tmpl';

    var source;
    grunt.file.copy(specRunnerTemplate, path.join(dir,tmpRunner), {
      process : function(src) {
        source = grunt.util._.template(src, {
          scripts : scripts,
          css : styles
        });
        return source
      }
    });
    return source;
  });

  // stolen from grunt/task/server. Might be misunderstanding grunt tasks, but it didn't seem very reusable
  grunt.registerHelper('static-server',function(base, port) {
    base = path.resolve(base);

    var server = connect();

    if (grunt.option('debug')) {
      connect.logger.format('grunt', ('[D] local server :method :url :status ' + ':res[content-length] - :response-time ms').magenta);
      server.use(connect.logger('grunt'));
    }

    server.use(connect.static(base));
    server.use(connect.directory(base));

    grunt.verbose.writeln('Starting static web server on port ' + port);
    return server.listen(port);
  });

  phantomjs.on('fail.timeout',function(){
    grunt.log.writeln();
    grunt.warn('PhantomJS timed out, possibly due to an unfinished async spec.', 90);
  });

  phantomjs.on('console',console.log.bind(console));
  phantomjs.on('debug', grunt.log.debug.bind(grunt.log, 'phantomjs'));
  phantomjs.on('write', grunt.log.write.bind(grunt.log));
  phantomjs.on('writeln', grunt.log.writeln.bind(grunt.log));
  phantomjs.on('onError',function(string, trace){
    grunt.log.writeln((string + ' at... ').red);
    if (trace) {
      trace.forEach(function(pop) {
        grunt.log.writeln('> ' + pop.file + ':' + pop.line + (pop.file.function ? ' ('+pop.file.function+')' : ''))
      })
    }
  });

  phantomjs.on('jasmine.*', function() {
    //var args = [this.event].concat(grunt.util.toArray(arguments));
    // grunt 0.4.0
    // grunt.event.emit.apply(grunt.event, args);
  });

};


function runPhantom(url,options,numReporters, cb) {
  var status;
  setupTestListeners(options,numReporters,function(testStatus){
    status = testStatus;
  });
  phantomjs.spawn(url, {
    failCode : 90,
    options  : options,
    done     : function(err){
      cb(err,status);
    }
  });
}

function getRelativeFileList(/* args... */) {
  var list = Array.prototype.slice.call(arguments);
  var base = path.resolve(baseDir);
  var files = [];
  list.forEach(function(listItem){
    files = files.concat(grunt.file.expandFiles(listItem));
  });
  files = grunt.util._(files).map(function(file){
    return path.resolve(file).replace(base,'');
  });
  return files;
}

function setupTestListeners(options,numReporters, doneCallback) {
  var status = {
    specs    : 0,
    failed   : 0,
    passed   : 0,
    total    : 0,
    skipped  : 0,
    duration : 0
  };

  phantomjs.on('jasmine.begin',function(){
    grunt.verbose.writeln('Starting...');
  });

  phantomjs.on('jasmine.writeFile',function(type,filename, xml){
    var dir = options[type] && options[type].output;
    if (dir) {
      grunt.file.mkdir(dir);
      grunt.file.write(path.join(dir, filename), xml);
    }
  });

  phantomjs.on('jasmine.testDone',function(totalAssertions, passedAssertions, failedAssertions, skippedAssertions){
    status.specs++;
    status.failed  += failedAssertions;
    status.passed  += passedAssertions;
    status.total   += totalAssertions;
    status.skipped += skippedAssertions;
  });

  phantomjs.on('jasmine.done',function(elapsed){
    grunt.verbose.writeln('All reporters done.');
    phantomjs.halt();
    status.duration = elapsed;
    doneCallback(status);
  });

  var reportersDone = 0;
  phantomjs.on('jasmine.done.*',function(){
    reportersDone++;
    if (reportersDone === numReporters) phantomjs.emit('jasmine.done');
  });

  phantomjs.on('jasmine.done.ConsoleReporter',function(){
  });
  phantomjs.on('jasmine.done.JUnitReporter',function(){
  });

  phantomjs.on('jasmine.done_fail',function(url){
    grunt.log.error();
    grunt.warn('PhantomJS unable to load "' + url + '" URI.', 90);
  });
}

