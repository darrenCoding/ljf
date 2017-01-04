
'use strict';

const opener = require('opener');
const path   = require('path');
const fs     = require('fs');

const HPATH = path.join(__dirname, "../ljhosts.txt");

let chosts = module.exports = {};

chosts.parse = function () {
    let action = ljserver.first.slice(1),
        len    = action.length;

    if ( ljserver.args.l ) {
        return this.list();
    }

    if ( ljserver.args.e ) {
        return this.edit();
    }

    if ( len ) {
        return len === 1 ? this.get(String(action)) : this.set(action)
    }

    this.list();
}

chosts.list = () => {
    if ( ljserver.file.exists(HPATH) ) {
        ljserver.log.info(`${HPATH}`);
        fs.createReadStream(HPATH).pipe(process.stdout);
    } 
}

chosts.get = function (name) {
    if ( this.readHosts()[name] ) {
        process.stdout.write(this.readHosts()[name] + "\n")
    } else {
        ljserver.log.error("Invalid variable");
    }
}

chosts.edit = () => {
    if ( !ljserver.file.exists(HPATH, true) ) {
        ljserver.file.writeFile(HPATH, '');
    }
    opener(HPATH);
}

chosts.readHosts = () => {
    let fdata = '',
        hobj  = {};
    if ( ljserver.file.exists(HPATH, true) ) {
        fdata = ljserver.file.read(HPATH).toString('utf-8');
        return fdata.split(/\r?\n/)
            .filter((str) => {
                return str.trim().length && (!/^#.+/.test(str.trim()))
            })
            .map((line) => {
                return line.trim()
                        .split('#')[0].trim()
                        .split(/\s+/)
            }).reduce((obj, line) => {
                obj[line[0]] = line[1];
                return obj;
            }, hobj)       
    } else {
        return hobj;
    }
}