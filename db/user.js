/**
 * Created by eric on 15-8-14.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var schema = new Schema({
    accounts: String,
    password: String,
    salt: String,
    role: String,
    permission: [String]
});

module.exports = mongoose.model('User', schema);