/*
 * grunt-dev
 * https://github.com/creynders/Grunt-Jasmine-Task
 *
 * Copyright (c) 2012 Camille Reynders
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/cowboy/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerTask('dev', 'Your task description goes here.', function() {
    grunt.log.write(grunt.helper('dev'));
  });

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  grunt.registerHelper('dev', function() {
    return 'dev!!!';
  });

};
