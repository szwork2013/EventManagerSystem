var express = require('express');
var db = require('../db/index');
var User = db.User;
var Role = db.Role;
var Menu = db.Menu;
var debug = require('debug')('EventManagerSystem:routes:user');
var router = express.Router();

router.get('/manager', function(req, res) {
  User.find({}).populate({path:'role', select:'name permission'}).exec(function (err, docs) {
    res.send(docs);
  });
});

router.post('/manager', function (req, res) {
  var accounts = req.body.accounts;
  var password = req.body.password;
  var role = req.body.role;
  var permission = req.body.permission;
  if (!accounts || !password || !role) {
    res.send({error:400});
    return;
  }
  var user = new User({
    accounts:accounts,
    password:password,
    role:role
  });
  user.save(function (err, user) {
    if (err) {res.send({error:500});return;}
    res.send(user);
  });
});

router.post('/manager/:id', function (req, res) {
  var id = req.params.id;
  var accounts = req.body.accounts;
  var password = req.body.password;
  var role = req.body.role;
  if (!accounts || !password || !role || !id){res.send({error:400});return;}
  User.findOne({_id:id}, function (err, user) {
    user.accounts = accounts;
    user.password = password;
    if (password!=='******') { user.isChangePwd = true; }
    user.role = role;
    user.save()
  });

  User.findOneAndUpdate({_id:id} ,{$set:user} ,function (err, result) {
    res.send({error:err,result:result});
  });

});

router.route('/role')
    .get(function (req, res) {
      Role.find({}, function (err, docs) {
        res.send(docs);
      });
})
    .post(function (req, res) {

});

router.route('/menu')
    .get(function (req, res) {
      debug('/menu GET',true);
      debug('req.query',req.query);
      Menu.find(req.query).exec(function (err, docs) {
        res.send(err?[err]:docs);
      });
    })
    .post(function (req, res) {
      debug('/menu POST',true);
      debug('req.body',req.body);

      if (!req.body.menu || req.body.menu.name==='') {
        res.send({error:1,reason:'参数不正确'});
        return;
      }
      var menu = req.body.menu;
      Menu.findOne({name:menu.name,parent:menu.parent}, function (err, doc) {
        if (err) {res.send({error:99,reason:'DB error：'+err});return;}
        if (doc) {res.send({error:2,reason:'同名菜单已存在'});return;}
        menu = new Menu(menu);
        menu.save(function (err, doc) {
          if (err) {res.send({error:99,reason:'DB error：'+err});return;}
          res.send({error:0,result:doc});
        });
      })
    });
router.route('/menu/:id')
    .post(function (req, res) {
      debug('/menu/:id POST',true);
      debug('req.params',req.params);
      if (!req.params.id || !req.body.menu.name) {res.send({error:1,reason:'参数不正确'});return;}
      var update = {
        name:req.body.menu.name,
        parent:req.body.menu.parent,
        url:req.body.menu.url
      };
      Menu.findOneAndUpdate({_id:req.params.id}, {$set:update}, function (err, doc) {
        debug('delete err',err);
        debug('delete doc',doc);
        if (err) {res.send({error:99,reason:'DB error:'+err});return;}
        if (!doc) {res.send({error:2,reason:'菜单不存在'});return;}
        res.send({error:0,result:doc});
      });
    })
    .delete(function (req, res) {
      debug('/menu/:id DELETE',true);
      debug('req.params',req.params);
      if (!req.params.id) {res.send({error:1,reason:'参数不正确'});return;}
      Menu.findOneAndRemove({_id:req.params.id}, function (err, doc) {
        debug('delete err',err);
        debug('delete doc',doc);
        if (err) {res.send({error:99,reason:'DB error:'+err});return;}
        if (!doc) {res.send({error:2,reason:'菜单不存在'});return;}
        res.send({error:0,result:doc});
      });
    });

module.exports = router;
