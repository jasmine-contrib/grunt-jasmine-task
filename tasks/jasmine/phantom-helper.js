/*
 * Is injected into the spec runner file

 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */

var phantom = phantom || {};

phantom.sendMessage = function(){
  var args = [].slice.call( arguments );
  alert( JSON.stringify( args ) );
}



