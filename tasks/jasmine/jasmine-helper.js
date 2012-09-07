jasmine.getEnv().addReporter( new jasmine.reporters.JUnitXmlReporter() );
jasmine.getEnv().addReporter( new jasmine.reporters.ConsoleReporter() );
jasmine.getEnv().execute();
