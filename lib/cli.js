
'use strict';

var path = require('path');

module.exports = function (answers) {
    if ( Object.keys(answers).length ) {
        var json = {
            'svndev' : answers.svndev ? answers.svndev : process.cwd(),
            'svnonline' : answers.svnonline
        }
        try{
            ljserver.file.writeJson(path.resolve(__dirname, '../config.json'), json);
        }catch (e) {
            ljserver.log.error(e);
        }
    }
}