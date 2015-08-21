/**
 * Created by eric on 15-8-21.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var schema = new Schema({
    name: String,
    parent: Schema.Types.Mixed,
    url: String
});

module.exports = mongoose.model('Menu', schema);