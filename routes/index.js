var express = require('express');
var salter = require('../lib/salt');
var expressJwt = require('express-jwt');
var jsonWebToken = require('jsonwebtoken');
var config = require('../config');
var db = require('../db/index');
var User = db.User;
var debug = require('debug')('EventManagerSystem:routes:index');
var router = express.Router();

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
  User.findOne({accounts:accounts},function (err, user) {
    if (err) {res.send({error:501,msg:'db 错误:'+err});return;}
    if (!user) {res.send({error:403,msg:'用户不存在或密码错误:'});return;}
    salter.equal(password, user.salt, user.password, function (result) {
      debug('result:',result);
      if (!result){res.send({error:403,msg:'用户不存在或密码错误:'});return;}
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

router.get('/user/manager', function(req, res) {
  User.find({}, function (err, docs) {
    res.send(docs);
  });
});

router.post('/user/manager', function (req, res) {
  var accounts = req.body.accounts;
  var password = req.body.password;
  var role = req.body.role;
  var permission = req.body.permission;
  if (!accounts || !password || !role || !permission) {
    res.send({error:400});
    return;
  }
  var user = new User({
    accounts:accounts,
    role:role,
    permission:permission
  });
  salter.getshasalt(password, function(hasd, salt) {
    user.password = hasd;
    user.salt = salt;
    user.save(function(result) {
      res.send({error:err,result:result});
    });
  })
});

router.post('/user/manager/:id', function (req, res) {
  var id = req.params.id;
  var accounts = req.body.accounts;
  var password = req.body.password;
  var role = req.body.role;
  var permission = req.body.permission;
  if (!accounts || !password || !role || !permission || !id){res.send({error:400});return;}
  var user = {
    accounts:accounts,
    role:role,
    permission:permission
  };
  if (password!=='******') { //密码未改时不修改
    salter.getshasalt(password, function(hashed, salt) {
      user.password = hashed;
      user.salt = salt;
    })
  }
  User.findOneAndUpdate({_id:id} ,{$set:user} ,function (err, result) {
    res.send({error:err,result:result});
  });

});


module.exports = router;
