
'use strict';

const chalk = require('chalk');
const util  = require('util');

const log   = module.exports = {};

/* The color of information */
const INFO  = chalk.cyan;

/* The color of error */
const ERROR = chalk.red;

/* The color of warn */

const WARN  = chalk.yellow

/* The color of debug */
const DEBUG = chalk.grey;

const type  = chalk.blue;

const pro   = chalk.bold.magenta;

log.info = function () {
    if ( !ljserver.args.s ) {
        let msg =  util.format.apply(util, arguments);
        return console.info(pro('ljf ') + type('[INFO] ') + INFO(msg));
    }
}

log.error = function () {
    let msg =  util.format.apply(util, arguments);
    return console.error(pro('ljf ') + type('[ERROR] ') + ERROR(msg));
}

log.debug = function () {
    let msg =  util.format.apply(util, arguments);
    return console.log(pro('ljf ') + type('[DEBUG] ') + DEBUG(msg));
}

log.warn = function () {
    let msg =  util.format.apply(util, arguments);
    return console.warn(pro('ljf ') + type('[WARN] ') + WARN(msg));
}