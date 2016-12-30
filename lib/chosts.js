
'use strict';

const opener = require('opener');
const path   = require('path');
const fs     = require('fs');

const HPATH = path.join(__dirname, "../ljhosts.txt");

let chosts = module.exports = {};

chosts.parse = () => {
    let action = ljserver.first.slice(1),
        len    = action.length;

    if ( ljserver.args.l ) {
        return chosts.list();
    }

    if ( ljserver.args.e ) {
        return chosts.edit();
    }

    if ( len ) {
        return len === 1 ? chosts.get(String(action)) : chosts.set(action)
    }

    chosts.list();
}

chosts.list = () => {
    if ( ljserver.file.exists(HPATH) ) {
        ljserver.log.info(`${HPATH}`);
        fs.createReadStream(HPATH).pipe(process.stdout);
    } 
}

chosts.get = (name) => {
    if ( chosts.readHosts()[name] ) {
        process.stdout.write(chosts.readHosts()[name] + "\n")
    } else {
        ljserver.log.error("Invalid variable");
    }
}

chosts.edit = () => {
    if ( !ljserver.file.exists(HPATH) ) {
        ljserver.file.writeFile(HPATH, '');
    }
    opener(HPATH);
}

chosts.readHosts = () => {
    let fdata = '';
    if ( ljserver.file.exists(HPATH) ) {
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
            }, {})       
    }
}