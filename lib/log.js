
'use strict';

var chalk = require('chalk');
var util  = require('util');

var log   = module.exports = {};

/* The color of information */
var INFO  = chalk.cyan;

/* The color of error */
var ERROR = chalk.red;

/* The color of warn */

var WARN  = chalk.yellow

/* The color of debug */
var DEBUG = chalk.grey;

var type  = chalk.blue;

var pro   = chalk.bold.magenta;

log.info = function () {
    if ( !ljserver.args.s ) {
        var msg =  util.format.apply(util, arguments);
        return console.info(pro('ljf ') + type('[INFO] ') + INFO(msg));
    }
}

log.error = function () {
    var msg =  util.format.apply(util, arguments);
    return console.error(pro('ljf ') + type('[ERROR] ') + ERROR(msg));
}

log.debug = function () {
    var msg =  util.format.apply(util, arguments);
    return console.log(pro('ljf ') + type('[DEBUG] ') + DEBUG(msg));
}

log.warn = function () {
    var msg =  util.format.apply(util, arguments);
    return console.warn(pro('ljf ') + type('[WARN] ') + WARN(msg));
}