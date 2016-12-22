
'use strict';

var fs    = require('fs-extra');
var path  = require('path');
var iconv = require('iconv-lite');

var file = module.exports = {};

var _0777 = 511 & (~process.umask());

file.readJSON = function (path) {
    if ( this.exists(path) ) {
        return fs.readJsonSync(path, {throws : true});
    }
}

file.mkdir = function (path, mode) {
  if ( typeof mode === 'undefined' ) {
    mode = _0777;
  }
  if ( fs.existsSync(path) ) {
    return ljserver.log.warn('%s has been created', path);
  }
  path.split('/').reduce(function (prev, next) {
    if ( prev && !fs.existsSync(prev) ) {
      try{
        fs.mkdirSync(prev, mode);
      }catch (e) {
        ljserver.log.error('%s',e.message)
      }
    }
    return prev + '/' + next;
  });
  if ( !fs.existsSync(path) ) {
    fs.mkdirSync(path, mode);
  }
};

file.sendFile = function (fpath, cb) {
    fs.exists(fpath, function (exist) {
        if ( exist ) {
            var chunks = [],
                size = 0,
                buf,
                str;
            var rs  = fs.createReadStream(fpath);
            rs.on('data', function (chunk) {
                chunks.push(chunk);
                size += chunk.length

            })
            rs.on('end', function () {
                buf = Buffer.concat(chunks, size);
                cb(buf);
            })
        } else {
            cb(null);
        }
    })
}

file.writeJson = function (filepath, content) {
    fs.writeJsonSync(filepath, content);
    fs.chmod(filepath, _0777);
}

file.exists = function (files) {
    var fpath = Array.isArray(files) ? files : [files];
    for(var i=0, len = fpath.length; i < len; i++){
        if ( !fs.existsSync(fpath[i]) ) {
            ljserver.log.error('Unable to read %s: No such file or directory.',fpath[i]);
            return false;
        }
    }
    return true;
}

file.readBuffer = function (buffer) {
    if ( ljserver.util.isUtf8(buffer) ) {
        buffer = buffer.toString('utf8');
        if ( buffer.charCodeAt(0) === 0xFEFF ) {
            buffer = buffer.substring(1);
        }
    } else {
        buffer = iconv.decode(buffer, 'gbk');
    }
  return buffer;
};

file.read = function (path, convert) {
    var content = '';
    if ( this.exists(path) ) {
        content = fs.readFileSync(path);
        if ( convert ) {
            content = this.readBuffer(content);
        }
    }
    return content;
};

file.writeFile = function (filename, data, encode) {
    encode = encode || 'utf-8';
    fs.writeFileSync(filename, data, {encoding:encode});
    fs.chmod(filename, _0777);
}

file.readDir = function readDir (dir, include) {
    var fileArr = [];
    include = include || [];
    include = Array.isArray(include) ? include : [include];
    if ( file.exists(dir) ) {
        fs.readdirSync(dir).forEach(function (f) {
            if( include.length ) {
                var _fpath = dir + '/' + f;
                if ( file.isDir(_fpath) ) {
                    fileArr.push.apply(fileArr, readDir(_fpath, include))
                } else {
                    if ( ~include.indexOf(path.extname(f).slice(1)) ) {
                        fileArr.push(f)
                    }
                }
            } else {
                fileArr.push(f)
            }
        })
    }
    return fileArr;
}

file.isDir = function (path) {
    return fs.statSync(path).isDirectory()
}