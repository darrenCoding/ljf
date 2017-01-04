
'use strict';

const path = require('path');

module.exports = (answers) => {
    if ( Object.keys(answers).length ) {
        let json = {
            'svndev' : answers.svndev ? answers.svndev : process.cwd(),
            'svnonline' : answers.svnonline
        }
        try{
            ljserver.file.writeJson(path.resolve(__dirname, '../config.json'), json);
        } catch (e) {
            ljserver.log.error(e);
        }
    }
}