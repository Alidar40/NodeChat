var winston = require('winston');
const config = require('../config');


function getLogger(module) {

  var path = module.filename.split('/').slice(-2).join('/');
  //Логгер объект. Можно расширить конфигурации. https://www.npmjs.com/package/winston#logging
  //Уровни логгирования { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
  return new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true,
        level: (config.get('status') == 'development') ? 'debug' : 'error',// if 'development' => 'debug' else 'error'
        label: path
      })
    ]
  });
}

module.exports = getLogger;