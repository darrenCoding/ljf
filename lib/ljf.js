
'use strict';

var exec    = require('child_process').exec;
var opener  = require('opener');
var path    = require('path');
var util    = require('./util');
var help    = require('./help');
var cli     = require('./cli');
var log     = require('./log');
var file    = require('./file');
var miny    = require('./minify');
var qrcode  = require('./qrcode');
var config  = require('./config');


/**
 * expose all properties and methods to external
 * @namespace ljserver
 */
var ljserver = module.exports = {};

// register global variable
Object.defineProperty(global, 'ljserver', {
  enumerable: true,
  writable: false,
  value: ljserver
});

ljserver.util = util;

ljserver.config = config;

ljserver.file = file;

ljserver.log = log;

ljserver.info = ljserver.file.readJSON(path.join(__dirname,'../package.json'));
/* parse args  */
ljserver.init = function (args, answers) {
    cli(answers)
    var server  = require('./server');
    var release = require('./release');
    var csvn    = require('./csvn');
    var build   = require('./build');
    this.args   = args;
    this.first  = args._;
    if ( args.v || args.version ) {
        ljserver.log.info('%s',ljserver.info.version)
    }
    /* launch a static server */
    if ( ~['server','proxy'].indexOf(this.first[0]) ) {
        server.listen();
    }

    switch ( this.first[0] ) {
        case 'init' :
            /* create new project */
            this.createDir();
            break;
        case 'release' :
            /* release directory or files */
            release.init();
            break;
        case 'build' :
            build.init(this.first[1]);
            break;
        case 'config' :
            /* Operate config.json */
            csvn.init();
            break;
        case 'minify' :
            miny.init(this.first[1],this.first[2])
            break;
        case 'root' :
            /* Display root */
            process.stdout.write(path.join(__dirname, '../') + '\n');
            break;
        case 'repo' :
            /* open wiki */
            opener('http://git.leju.com/linfang3%2Fljf/wikis/home')
            break;
        case 'help' :
            help(this.first[1])
            break;
        case 'man' :
            opener('http://man.linuxde.net/' + this.first[1]);
            break;
        case 'update' :
            this.update();
            break;
        case 'qrcode' :
            qrcode.create(this.first[1]);
    }
}

ljserver.createDir = function () {
    var dir = this.first[1];
    if ( !dir ) {
        dir = 'lj_init';
    }
    ljserver.util.flatten(dir, ljserver.config.project).forEach(function (paths) {
        var ext = path.extname(paths).slice(1);
        if ( ext && ext === 'json' ) {
            this.file.writeFile(paths, ljserver.resourceContent)
        } else {
            this.file.mkdir(paths)
        }
    },ljserver)
    ljserver.log.info('ljserver project %s init done!', dir)
    this.childSpawn(dir);
}

/* update version */
ljserver.update = function () {
    exec('sh update.sh ' + path.join(__dirname, '../') , function (error, stdout, stderr) {
        if( error ){
            return ljserver.log.error(String(error));
        }else{
            ljserver.log.info('update success！');
        }
    })
}

/* create package.json */
ljserver.childSpawn = function (dir) {
    exec('npm init --yes',{
        'cwd' : process.cwd() + '/' + dir
    },function (error, stdout, stderr) {
        error = error || stderr
        if ( error ) {
            return ljserver.log.error(String(err));
        }else{
            ljserver.log.info(stdout)
            process.exit(0);
        }
    });
}

Object.defineProperty(ljserver, 'resourceContent', {
    configurable: true,
    enumerable: true,
    get: function protocol () {
        return [
            '{\n  //项目域名\n',
            '  \"domain\" : {\n',
            '    \"dev\" : \"bch.my.leju.com\",//测试环境\n',
            '    \"online\" : \"my.leju.com\"//线上环境\n',
            '  },\n',
            '\n',
            '  //文件别名\n',
            '  \"alias\" : {\n',
            '    \"sso\" : \"/sso/sso.js\",\n',
            '    \"zb_play\" : \"js/zb_play.min.js\"\n',
            '  },\n',
            '\n',
            '  //资源别名\n',
            '  \"resource\" : {\n',
            '    \"login\" : [\n',
            '      {\n',
            '        \"asset\" : [\"sso\"],\n',
            '        \"param\" : \"r\"\n',
            '      }\n',
            '      {\n',
            '        \"asset\" : [\"zb_play\"],\n',
            '        \"param\" : \"c\"\n',
            '      }\n',
            '    ]\n',
            '  },\n',
            '\n',
            '  //页面加载逻辑\n',
            '  \"rules\" : {\n',
            '    \"/web/sso/loginView\" : \"login\",\n',
            '    \"/web/sso/register\" : [\n',
            '      {\n',
            '        \"asset\" : [\"js/z_list.min.js\"]\n',
            '      }\n',
            '      {\n',
            '        \"asset\" : \"/sso/sso.js\",\n',
            '        \"param\" : \"c\"\n',
            '      }\n',
            '    ]\n',
            '  }\n}'
        ].join('')
    }
})




