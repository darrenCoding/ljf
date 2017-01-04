
'use strict';

const getPort = require('get-port');
const crypto  = require('crypto');
const lsofi   = require('lsofi');
const os      = require("os");

let util = module.exports = {};

let objectRegExp = /^\[object (\S+)\]$/,
    toString     = Object.prototype.toString;

let ISWIN = process.platform.indexOf('win') === 0;

function getType (obj) {
  let type = typeof obj;
  if ( type !== 'object' ) {
    return type;
  }
  return toString.call(obj)
    .replace(objectRegExp, '$1').toLowerCase();
}

/* get local ip */
util.getLocalIp = () => {
  let narr = os.networkInterfaces(),
      ip = '';
  Object.keys(narr).forEach( (ipt) => {
    narr[ipt].forEach( (obj) => {
      if ( ip === '' && obj.family === 'IPv4' && !obj.internal ) {
        ip = obj.address;
        return;
      }
    })
  })
  return ip || "127.0.0.1";
}

/* get a local available port */
util.getPort = (port, cb) => {
  return new Promise( (resolve,reject) => {
    if ( !port ) {
      return getPort().then( (port) => {
        resolve(port)
      })
    } else {
      return lsofi(port).then( (pid) => {
        resolve(pid ? null : port)
      })
    }
  })
}

util.killPort = (port) => {
  let kill = (pid) => {
    return Promise.resolve(process.kill(pid))
  }

  return lsofi(port)
    .then( (pid) => {
      if (pid === null) {
        return true
      }
      return kill(pid)
        .then( () => {
          return true
        })
    })
}

util.mix = function mix(a, b) {
  if ( a && b ) {
    for (let key in b) {
      if ( typeof b[key] === 'object' ){
        mix(a[key], b[key])
      }else{
        a[key] = b[key];
      }
    }
  }
  return a;
};

util.flatten = function flatten (prefix, arr) {
  if ( this.isArray(prefix) ) {
    arr = prefix;
    prefix = '';
  }
  prefix += prefix && "/";
  let result = [];
  arr.forEach( (item) => {
    if ( this.isObject(item) ) {
      Object.keys(item).forEach( (v) => {
        if ( this.isArray(item[v]) ) {
          result.push.apply(result, flatten.call(this, prefix + v, item[v]))
        } else {
          result.push(v);
        }
      },this)
    } else {
      result.push(prefix + item)
    }
  })
  return result;
}

util.md5 = (data, len) => {
  let md5sum = crypto.createHash('md5'),
      encoding = typeof data === 'string' ? 'utf8' : 'binary';
  md5sum.update(data, encoding);
  len = len || 4;
  let md5data = md5sum.digest('hex');
  return md5data.substring(0, len) + md5data.substr(-3,3);
};

util.isWin = () => {
  return ISWIN;
};

util.isObject = (source) => {
  return getType(source) === 'object';
};

util.isArray = (source) => {
  return getType(source) === 'array';
};

util.eachOf = (arr, fn, callback, context) => {
  callback = callback || function() {};
  arr = arr || [];
  context = context || null;

  let i = 0,
      len = Array.isArray(arr) ? arr.length : Object.keys(arr).length

  if ( Array.isArray(arr) ) {
    arr.forEach( (val, i) => {
      fn.call(context, val, i, done);
    });
  } else {
    for (let key in arr) {
      if ( arr.hasOwnProperty(key) ) {
        fn.call(context, arr[key], key, done);
      }
    }
  }

  function done(err){
    i++;
    if ( err ) {
      return callback.call(context, err);
    }
    if ( i === len ) {
      callback.call(context);
    }
  }
}

util.eachOfSeries = (arr, fn, callback, context) => {
  callback = callback || function() {};
  arr = arr || [];
  context = context || null;

  let i = -1;

  next();

  function next() {
    if ( ++i === arr.length ) {
      return callback.call(context);
    }

    fn.call(context, arr[i], i, done);
  }

  function done (err) {
    if ( err ) {
      return callback.call(context, err);
    }
    next();
  }
}


util.eachOfLimit = (limit, obj, iterator, callback, context) => {
  callback = callback || function(){};
  obj = obj || [];
  context = context || null;
  if ( limit <= 0 ) {
    return callback(null);
  }
  let done = false,
      running = 0,
      i = -1,
      len = obj.length,
      errored = false;

  (function replenish () {
    if ( done && running <= 0 ) {
      return callback(null);
    }

    while( running < limit && !errored ) {
      if ( ++i >= len ) {
        done = true;
        if ( running <= 0 ) {
          callback(null);
        }
        return;
      }
      running += 1;
      iterator.call(context, obj[i], i, (err) => {
          running -= 1;
          if ( err ) {
            callback(err);
            errored = true;
          } else {
            replenish();
          }
      });
    }
  })();
}

util.isUtf8 = (bytes) => {
  var i = 0;
  while (i < bytes.length) {
    if (( // ASCII
        0x00 <= bytes[i] && bytes[i] <= 0x7F
      )) {
      i += 1;
      continue;
    }

    if (( // non-overlong 2-byte
        (0xC2 <= bytes[i] && bytes[i] <= 0xDF) &&
        (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF)
      )) {
      i += 2;
      continue;
    }

    if (
      ( // excluding overlongs
        bytes[i] == 0xE0 &&
        (0xA0 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
        (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
      ) || ( // straight 3-byte
        ((0xE1 <= bytes[i] && bytes[i] <= 0xEC) ||
          bytes[i] == 0xEE ||
          bytes[i] == 0xEF) &&
        (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
        (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
      ) || ( // excluding surrogates
        bytes[i] == 0xED &&
        (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x9F) &&
        (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF)
      )
    ) {
      i += 3;
      continue;
    }

    if (
      ( // planes 1-3
        bytes[i] == 0xF0 &&
        (0x90 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
        (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
        (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
      ) || ( // planes 4-15
        (0xF1 <= bytes[i] && bytes[i] <= 0xF3) &&
        (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0xBF) &&
        (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
        (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
      ) || ( // plane 16
        bytes[i] == 0xF4 &&
        (0x80 <= bytes[i + 1] && bytes[i + 1] <= 0x8F) &&
        (0x80 <= bytes[i + 2] && bytes[i + 2] <= 0xBF) &&
        (0x80 <= bytes[i + 3] && bytes[i + 3] <= 0xBF)
      )
    ) {
      i += 4;
      continue;
    }
    return false;
  }
  return true;
};
