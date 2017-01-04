
'use strict';

const fs    = require('fs-extra');
const path  = require('path');
const iconv = require('iconv-lite');

let file = module.exports = {};

let _0777 = 511 & (~process.umask());

file.readJSON = function (path) {
    if ( this.exists(path) ) {
        return fs.readJsonSync(path, {throws : true});
    }
}

file.mkdir = (path, mode) => {
  if ( typeof mode === 'undefined' ) {
    mode = _0777;
  }
  if ( fs.existsSync(path) ) {
    return ljserver.log.warn(`${path} has been created`);
  }
  path.split('/').reduce( (prev, next) => {
    if ( prev && !fs.existsSync(prev) ) {
      try{
        fs.mkdirSync(prev, mode);
      } catch (e) {
        ljserver.log.error(`${e.message}`)
      }
    }
    return prev + '/' + next;
  });
  if ( !fs.existsSync(path) ) {
    fs.mkdirSync(path, mode);
  }
};

file.sendFile = (fpath, cb) => {
    fs.exists(fpath, (exist) => {
        if ( exist ) {
            let chunks = [],
                size = 0,
                buf,
                str;
            let rs  = fs.createReadStream(fpath);
            rs.on('data', (chunk) => {
                chunks.push(chunk);
                size += chunk.length

            })
            rs.on('end', () => {
                buf = Buffer.concat(chunks, size);
                cb(buf);
            })
        } else {
            cb(null);
        }
    })
}

file.writeJson = (filepath, content) => {
    fs.writeJsonSync(filepath, content);
    fs.chmod(filepath, _0777);
}

file.exists = (files, nout) => {
    let fpath = Array.isArray(files) ? files : [files];
    for ( let i = 0, len = fpath.length; i < len; i++ ) {
        if ( !fs.existsSync(fpath[i]) ) {
            !nout && ljserver.log.error(`Unable to read ${fpath[i]}: No such file or directory.`);
            return false;
        }
    }
    return true;
}

file.readBuffer = (buffer) => {
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
    let content = '';
    if ( this.exists(path) ) {
        content = fs.readFileSync(path);
        if ( convert ) {
            content = this.readBuffer(content);
        }
    }

    return content;
};

file.writeFile = (filename, data, encode) => {
    encode = encode || 'utf-8';
    fs.writeFileSync(filename, data, {encoding:encode});
    fs.chmod(filename, _0777);
}

file.readDir = function readDir (dir, include) {
    let fileArr = [];
    include = include || [];
    include = Array.isArray(include) ? include : [include];
    if ( file.exists(dir) ) {
        fs.readdirSync(dir).forEach(function (f) {
            if( include.length ) {
                let _fpath = dir + '/' + f;
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

file.isDir = (path) => {
    return fs.statSync(path).isDirectory()
}