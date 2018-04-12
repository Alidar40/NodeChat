var nconf = require('nconf');
var path = require('path');

var env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  var config = require('./config.json');
  var envConfig = config[env];

  Object.keys(envConfig).forEach((key) => {
    process.env[key] = envConfig[key];
  });
}

/*
nconf.argv()
  .env()
  .file({ file: path.join(__dirname, 'config.json') });*/

module.exports = nconf;