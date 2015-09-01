/**
 * Created by eric on 15-8-14.
 */
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');

var SALT_WORK_FACTOR = 10;

var Schema = mongoose.Schema;

var schema = new Schema({
    accounts: String,
    password: String,
    role: { type : Schema.Types.ObjectId , ref : 'Role' }
});

schema.pre('save', function (next) {
    var user = this;
    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);
        // hash the password using our new salt
        console.log('save user password:', user.password);
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);
            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

schema.method('comparePassword', function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        console.log('comparePassword.err:',err);
        console.log('comparePassword.isMatch:',isMatch);
        if (err) {return cb(err);}
        cb(null, isMatch);
    });
});

schema.static('getAuthenticated', function (accounts, password, cb) {
    this.findOne({accounts:accounts}, function (err, user) {
        console.log('err:',err);
        console.log('user:',user);
        if (err) return cb(err);
        if (!user) return cb(null, null, {msg:'用户不存在！'});
        user.comparePassword(password, function (err, isMatch) {
            if (err) return cb(err);
            if (isMatch) {
                return cb(null, user, {msg:'登陆成功！'});
            } else {
                return cb(null, null, {msg:'用户名密码不正确！'});
            }
        })
    })
});

module.exports = mongoose.model('User', schema);