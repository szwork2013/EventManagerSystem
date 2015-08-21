/**
 * Created by eric on 15-8-14.
 */
var salter = require('../lib/salt');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var schema = new Schema({
    accounts: String,
    password: String,
    salt: String,
    role: { type : Schema.Types.ObjectId , ref : 'Role' }
});

schema.pre('save', function (next) {
    var user = this;
    // only hash the password if it has been modified (or is new)
    if (!user.isChangePwd) return next();
    // generate a salt
    salter.getshasalt(user.password, function (err, gen) {
        if (err) return next(err);
        // hash the password using our new salt
        debug('save user password:', user.password);
        user.password = gen.hash;
        user.salt = gen.salt;
        next();
    });
});

schema.method('comparePassword', function (candidatePassword, cb) {
    salter.equal(candidatePassword, this.salt, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
});

schema.static('getAuthenticated', function (accounts, password, cb) {
    this.findOne({accounts:accounts}, function (err, user) {
        if (err) return cb(err);
        if (!user) return cb(null, null, {msg:'用户不存在！'});
        user.comparePassword(password, function (err, isMatch) {
            if (err) return cb(err);
            if (isMatch) {
                return cb(null, user, {msg:'登陆成功！'});
            }
        })
    })
});

module.exports = mongoose.model('User', schema);