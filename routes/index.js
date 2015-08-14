var express = require('express');
var expressJwt = require('express-jwt');
var jsonWebToken = require('jsonwebtoken');
var db = require('../db/index');
var debug = require('debug')('routes:index');

var router = express.Router();

//router.use(expressJwt(config.jwt).unless({
//}));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
