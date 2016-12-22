
'use strict';

module.exports = {
    'project' : [
        {
            'src' : ['js','css','deps','tmpl']
        },
        {
            'build' : ['js','css','images']
        },
        'widget',
        'doc',
        'static',
        'resourceMap.json'
    ],
    'host' : 'cdn地址',
    'test' : '测试ip',
    'online' : '线上ip',
    'https' : {
        'cert' : 'server.key',
        'crt' : 'server.crt'
    },
    'cache' : {
        'index' : '清缓存页面',
        'clear' : '清缓存地址'
    },
    'build' : {
        'domain' : 'cdn地址',
        'resource' : 'resourceMap.json',
        'create' : 'resourceLoader.js'
    }
}