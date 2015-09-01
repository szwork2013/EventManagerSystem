/**
 * Created by yuke_asus on 2015/8/19.
 */
var db = require('../db');
var User = db.User;
var Role = db.Role;
var debug = require('debug')('EventApp:test:createAdmin');
var config = require('../config');

db.connect(config.db.uri, config.db.options);
db.connection.on('error', function (err) {
    debug('Connect to DB failed!');
    debug(err);
    process.exit(1);
});
db.connection.on('open', function () {
    debug('Connect to DB successful! url:',config.db.uri);
    if (user.accounts && user.password && user.role){
        Role.findOne({name:user.role}, function (err, doc) {
            if (doc) {
                var saveUser = new User(user);
                saveUser.role = doc._id;
                saveUser.save(function (err, doc) {
                    debug('user:',doc);
                    process.exit(1);
                });
            }
        })
    }
    else
    {
        debug('需要参数 accounts=xxx password=xxx role=xxx');
        process.exit(1);
    }
});

var user = {};
process.argv.forEach(function(argv) {
   if (argv.indexOf('=')>-1) {
       var params = argv.split('=');
       user[params[0]] = params[1];
   }
});