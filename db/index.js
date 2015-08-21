/**
 * Created by eric on 15-8-13.
 */
var User = require('./user');
var Role = require('./role');
var Menu = require('./menu');
var mongoose = require('mongoose');

module.exports = exports = mongoose;

exports.User = User;
exports.Role = Role;
exports.Menu = Menu;
