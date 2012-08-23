/*
 * Is injected into the spec runner file

 * Copyright (c) 2012 Camille Reynders
 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */

/*global jasmine:true, alert:true*/

// Send messages to the parent phantom.js process via alert! Good times!!

var phantom = phantom || {};

phantom.sendMessage = function(){
  var args = [].slice.call( arguments );
  alert( JSON.stringify( args ) );
}



