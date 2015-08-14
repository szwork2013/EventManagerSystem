var express = require('express');
var salter = require('../lib/salt');
var expressJwt = require('express-jwt');
var jsonWebToken = require('jsonwebtoken');
var config = require('../config');
var db = require('../db/index');
var User = db.User;
var debug = require('debug')('routes:index');
var router = express.Router();

// 启用 JSON Web Token (JWT) 保护所有 API 接口（除了登陆）
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
  User.findOne({accounts:accounts},function (err, user) {
    if (err) {res.send({error:501,msg:'db 错误:'+err});return;}
    if (!user) {res.send({error:403,msg:'用户不存在或密码错误:'});return;}
    salter.equal(password, user.salt, function (result) {
      debug('result:',result);
      if (result!==user.password){res.send({error:403,msg:'用户不存在或密码错误:'});return;}
      res.send({
        jwt: jsonWebToken.sign({
          userId: user['_id']
        }, config.jwt.secret, {expiresInMinutes: 60 * 12}),
        user:{
          accounts:user['accounts'],
          role:user['role']
        }
      });
    });
  });
});

module.exports = router;
