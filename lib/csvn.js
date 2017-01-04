
'use strict';

const config = require('../config.json');
const path   = require('path');
const fs     = require('fs');


let csvn = module.exports = {};

csvn.parse = function () {
    let action = ljserver.first.slice(1),
        len    = action.length;
    if ( ljserver.args.l ) {
        this.list();
    } else {
        len && (len === 1 ? this.get(String(action)) : this.set(action))
    }
}

csvn.set = function (data) {
    let newObj = {},
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

csvn.get = (name) => {
    if ( config[name] ) {
        process.stdout.write(config[name] + "\n")
    } else {
        ljserver.log.error("Invalid variable");
    }
}

csvn.list = () => {
    fs.createReadStream(path.join(__dirname, "../config.json")).pipe(process.stdout);
}