/**
 * Created by eric on 15-8-14.
 */
var mongoose = require('mongoose');
var crypto = require('crypto');

var Schema = mongoose.Schema;

var schema = new Schema({
    accounts: String,
    password: String,
    salt: String,
    role: String
});

module.exports = mongoose.model('User', schema);