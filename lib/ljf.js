
'use strict';

const exec    = require('child_process').exec;
const opener  = require('opener');
const path    = require('path');
const util    = require('./util');
const help    = require('./help');
const cli     = require('./cli');
const log     = require('./log');
const file    = require('./file');
const miny    = require('./minify');
const qrcode  = require('./qrcode');
const config  = require('./config');
const hosts   = require('./chosts');


/**
 * expose all properties and methods to external
 * @namespace ljserver
 */
let ljserver = module.exports = {};

// register global variable
Object.defineProperty(global, 'ljserver', {
  enumerable: true,
  writable: false,
  value: ljserver
});

ljserver.util = util;

ljserver.config = config;

ljserver.hosts = hosts

ljserver.file = file;

ljserver.log = log;

ljserver.info = ljserver.file.readJSON(path.join(__dirname, '../package.json'));
/* parse args  */
ljserver.init = function (args, answers) {
    cli(answers)
    const server  = require('./server');
    const release = require('./release');
    const csvn    = require('./csvn');
    const build   = require('./build');
    this.args   = args;
    this.first  = args._;
    if ( args.v || args.version ) {
        ljserver.log.info(`${ljserver.info.version}`)
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
            csvn.parse();
            break;
        case 'hosts' :
            hosts.parse();
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
    let dir = this.first[1];
    if ( !dir ) {
        dir = 'lj_init';
    }
    ljserver.util.flatten(dir, ljserver.config.project).forEach( (paths) => {
        let ext = path.extname(paths).slice(1);
        if ( ext && ext === 'json' ) {
            this.file.writeFile(paths, ljserver.resourceContent)
        } else {
            this.file.mkdir(paths)
        }
    })
    ljserver.log.info(`ljserver project ${dir} init done!`)
    this.childSpawn(dir);
}

/* update version */
ljserver.update = () => {
    exec('sh update.sh ' + path.join(__dirname, '../') , (error, stdout, stderr) => {
        if( error ){
            return ljserver.log.error(String(error));
        }else{
            ljserver.log.info('update success！');
        }
    })
}

/* create package.json */
ljserver.childSpawn = (dir) => {
    exec('npm init --yes',{
        'cwd' : process.cwd() + '/' + dir
    }, (error, stdout, stderr) => {
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




