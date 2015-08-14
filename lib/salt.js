/**
 * Created by eric on 15-8-14.
 */
var crypto = require('crypto');

exports.getshasalt = function (txt, callback) {
    crypto.randomBytes(128, function (err, salt) {
        if (err) { throw err;}
        salt = salt.toString('hex');

        crypto.pbkdf2(txt, salt, 4096, 256, function (err,hash) {
            if (err) { throw err; }
            hash = hash.toString('hex');
            callback(hash, salt);
        })
    });
};

exports.equal = function (pwd, salt, callback){
  crypto.pbkdf2(pwd, salt, 4096 ,256, function (err, hash) {
     callback(hash.toString('hex'));
  });
};

var _test = function () {
    exports.getshasalt('3308011',function(hash, salt) {
        console.log('hashPwd:',hash);
        console.log('salt:',salt);
    });
};