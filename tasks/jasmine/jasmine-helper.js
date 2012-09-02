/*global jasmine:false*/

var jasmineEnv = jasmine.getEnv();

jasmineEnv.updateInterval = 1000;
jasmineEnv.addReporter( new jasmine.HtmlReporter() );

/*
jasmineEnv.specFilter = function(spec) {
  return trivialReporter.specFilter(spec);
};
*/

var currentWindowOnload = window.onload;

window.onload = function() {
  if (currentWindowOnload) {
    currentWindowOnload();
  }
  execJasmine();
};

function execJasmine() {
  jasmineEnv.execute();
}
