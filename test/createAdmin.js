/**
 * Created by yuke_asus on 2015/8/19.
 */
var db = require('../db');
var User = db.User;
var debug = require('debug')('EventApp:test:createAdmin');
var config = require('../config');
var salter = require('../lib/salt');

db.connect(config.db.uri, config.db.options);
db.connection.on('error', function (err) {
    debug('Connect to DB failed!');
    debug(err);
    process.exit(1);
});
db.connection.on('open', function () {
    debug('Connect to DB successful! url:',config.db.uri);
    if (user.accounts && user.password && user.role){
        salter.getshasalt(user.password,function (hash, salt) {
            user.password = hash;
            user.salt = salt;
            saveUser = new User(user);
            saveUser.save(function (err, doc) {
                debug('admin add error:',err);
                debug('admin add success:',doc);
            });
        });
    }
    else
    {
        debug('需要参数 accounts=xxx password=xxx role=xxx');
    }
});

var user = {};
process.argv.forEach(function(argv) {
   if (argv.indexOf('=')>-1) {
       var params = argv.split('=');
       user[params[0]] = params[1];
   }
});