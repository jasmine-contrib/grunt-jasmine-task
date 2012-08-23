/*
 * Copyright (c) 2012 Camille Reynders
 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */

/*global phantom:true*/

/*
 arguments:
 0 -> tempfile
 1 -> jasmine helper file
 2 -> spec html file
 */

(function(){
  "use strict";

  var fs = require( 'fs' );

  // The temporary file used for communications.
  var args = Array.prototype.slice.call(phantom.args);
  var tmpfile = args.shift();

  // The Jasmine .html specs file to run.
  var url = args.shift();

  //in milliseconds
  var timeout = args.shift();

  // The Jasmine helper file to be injected.
  var helpers = args;

  // Keep track of the last time a Jasmine message was sent.
  var last = new Date();

  // Messages are sent to the parent by appending them to the tempfile.
  function sendMessage( args ){
    last = new Date();
    fs.write( tmpfile, JSON.stringify( args ) + '\n', 'a' );
    // Exit when all done.
    if( /^done/.test( args[0] ) ){
      phantom.exit();
    }
  }

  // Send a debugging message.
  function sendDebugMessage(){
    sendMessage( ['debug'].concat( [].slice.call( arguments ) ) );
  }

  // Abort if Jasmine doesn't do anything for a while.
  setInterval( function(){
    if( new Date() - last > timeout ){
      sendMessage( ['done_timeout'] );
    }
  }, 1000 );

  // Create a new page.
  var page = require( 'webpage' ).create();

  // Jasmine sends its messages via alert(jsonstring);
  page.onAlert = function( args ){
    sendMessage( JSON.parse( args ) );
  };

  // Keep track if Jasmine has been injected already.
  var injected;

  // Additional message sending
  page.onConsoleMessage = function( message ){
    sendMessage( ['console', message] );
  };
  page.onResourceRequested = function( request ){
    if( /\/jasmine\.js$/.test( request.url ) ){
      // Reset injected to false, if for some reason a redirect occurred and
      // the test page (including jasmine.js) had to be re-requested.
      injected = false;
    }
    var method = request.method || 'GET';
    sendDebugMessage( 'onResourceRequested', method + ' ' + request.url );
  };
  page.onResourceReceived = function( request ){
    if( request.stage === 'end' ){
      var method = request.method || 'GET';
      sendDebugMessage( 'onResourceRequested', method + ' ' + request.url );
    }
  };

  page.onError = function(msg, trace) {
    sendMessage(['error',msg]);
    var buffer = '';
    trace.forEach(function(line){
      buffer += ' > ' + line.file + ':' + line.line + (line.function ? 'in ' + line.function + '()' : '') + "\n";
    });
    sendMessage(['error',buffer]);
  };

  page.open( url, function( status ){
    // Only execute this code if Jasmine has not yet been injected.
    if( injected ){
      return;
    }
    injected = true;
    // The window has loaded.
    if( status !== 'success' ){
      // File loading failure.
      sendMessage( ['done_fail', url] );
    }else{
      // Inject Jasmine helper file.
      helpers.forEach(function(val){
        sendDebugMessage( 'inject', val );
        page.injectJs( val );
      });
      // Because injection happens after window load, "begin" must be sent
      // manually.
      sendMessage( ['begin'] );
    }
  } );

}());

