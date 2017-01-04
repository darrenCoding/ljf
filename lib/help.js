
'use strict';

let examples = {
    'init' : [
        'ljf init',
        'ljf init cms'
    ],
    'server' : [
        'ljf server',
        'ljf server -p 8080',
        'ljf server -b -p 8080'
    ],
    'build' : [
        'ljf build dev',
        'ljf build online'
    ],
    'minify' : [
        'ljf minify src build',
        'ljf minify build'
    ],
    'release' : [
        'ljf release -d',
        'ljf release a.js',
        'ljf release a.js b.js',
        'ljf release a.js -m "update"'
    ],
    'proxy' : [
        'ljf proxy -l',
        'ljf proxy -t',
        'ljf proxy -o'
    ],
    'config' : [
        'ljf config -l',
        'ljf config svndev',
        'ljf config svndev /Users/linfang/Documents/svn/trunk'
    ],
    'man' : [
        'ljf man ls'
    ],
    'repo' : [
        'ljf repo'
    ],
    'root' : [
        'ljf root'
    ],
    'qrcode' : [
        'ljf qrcode https://www.baidu.com/'
    ],
    'update' : [
        'ljf update'
    ]
}

module.exports = (commander) => {
    if ( examples[commander] ) {
        process.stdout.write([
            'Examples:',
            examples[commander].join('\n')
        ].join('\n') + '\n')
    } else {
        ljserver.log.error('Error commander')
    }
}