
'use strict';

var config = require('../config.json');
var path   = require('path');
var fs     = require('fs');


var csvn = module.exports = {};

csvn.init = function () {
    var action = ljserver.first.slice(1),
        len = action.length;
    if ( ljserver.args.l ) {
        this.list();
    } else {
        len && (len === 1 ? this.get(String(action)) : this.set(action))
    }
}

csvn.set = function (data) {
    var newObj = {},
        name   = data[0],
        value  = data[1];
    if ( config[name] ) {
        newObj[name] = value;
        ljserver.file.writeJson(path.resolve(__dirname,"../config.json"), ljserver.util.mix(config, newObj));
        ljserver.log.info('Update done！\n');
        this.list();
    } else {
        ljserver.log.error("Invalid variable");
    }
}

csvn.get = function (name) {
    if ( config[name] ) {
        process.stdout.write(config[name] + "\n")
    } else {
        ljserver.log.error("Invalid variable");
    }
}

csvn.list = function () {
    fs.createReadStream(path.join(__dirname, "../config.json")).pipe(process.stdout);
}