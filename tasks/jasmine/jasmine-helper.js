/*
 * Is injected into the spec runner file
 
 * Copyright (c) 2012 Camille Reynders
 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */

/*global QUnit:false, alert:true*/

// Send messages to the parent phantom.js process via alert! Good times!!
function sendMessage() {
    var args = [].slice.call(arguments);
    alert(JSON.stringify(args));
}

var GruntReporter = function(){
    this._started = this._getTime();
};
GruntReporter.prototype = {
    _getTime : function(){
        return new Date().getTime();
    },
    _getSuitesToRoot : function( suite ){
        var result =[];
        do{
            result.unshift( suite.description );
            suite = suite.parentSuite;
        }while( suite );
        return result;
    },
    reportRunnerResults : function(runner){
        var elapsed = this._getTime() - this._started;
        sendMessage( 'done', elapsed );
    },
    /**
     *
     * @param {jasmine.Spec} spec
     */
    reportSpecResults : function(spec) {
        var results = spec.results();
        //{"totalCount":1,"passedCount":1,"failedCount":0,"skipped":false,"items_":[{"type":"expect","matcherName":"toBeInstanceOf","passed_":true,"actual":{"_listeners":{},"fqn":"jsfsa.State","name":"main","isInitial":false,"_transitions":{}},"message":"Passed.","trace":""}],"description":"should be of type jsfsa.State"}
        var suites = this._getSuitesToRoot( spec.suite );
        sendMessage( 'testDone', suites.join( ' ' ), spec.description, results.totalCount, results.passedCount, results.failedCount, results.skipped );
    }
};

jasmine.getEnv().addReporter( new GruntReporter() );