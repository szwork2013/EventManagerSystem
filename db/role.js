/**
 * Created by eric on 15-8-14.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var schema = new Schema({
    name: String,
    permission: [String]
});

module.exports = mongoose.model('Role', schema);