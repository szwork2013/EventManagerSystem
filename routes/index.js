var express = require('express');
var expressJwt = require('express-jwt');
var jsonWebToken = require('jsonwebtoken');
var config = require('../config');
var db = require('../db/index');
var User = db.User;
var debug = require('debug')('EventManagerSystem:routes:index');
var router = express.Router();
var user = require('./user');

// 启用 JSON Web Token (JWT) 保护所有 API 接口（除了登陆）
debug(config.jwt);
router.use(expressJwt(config.jwt).unless({
  path: ['/api/user/login', '/api/account/list']
}));

router.post('/user/login', function(req, res, next) {
  var accounts = req.body.accounts;
  var password = req.body.password;
  debug('/user/login',true);
  debug('accounts',accounts);
  debug('password',password);

  if (!accounts || !password)
  {
    res.send({error:400});
    return;
  }
  User.getAuthenticated(accounts, password, function (err, user, result) {
    if (err) {
      debug(err);
      res.send({error: err});
      return;
    }
    if (user) {
      debug('user:',user);
      User.findOne({_id:user['_id']}).populate({path:'role', select:'name permission'}).exec(function (err, doc) {
        debug('user:',doc);
        if (err) {
          debug(err);
          res.send({error: err});
          return;
        }
        var result = {
          jwt: jsonWebToken.sign({
            userId: doc._id
          }, config.jwt.secret, {expiresInMinutes: 60 * 12}),
          user:{
            accounts:doc.accounts,
            role:doc.role
          }
        };
        debug(result);
        res.send(result);
        return;
      })
    }
    else
    {
      res.send({error:result.msg});
    }
  });
});

router.use('/user',user);

module.exports = router;
