/*global jasmine:false*/

var jasmineEnv = jasmine.getEnv();

jasmineEnv.updateInterval = 1000;
jasmineEnv.addReporter( new jasmine.HtmlReporter() );

/*
jasmineEnv.specFilter = function(spec) {
  return trivialReporter.specFilter(spec);
};
*/

jasmineEnv.execute();
