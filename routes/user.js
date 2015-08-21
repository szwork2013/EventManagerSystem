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
      var query = {};
      if (req.query.parent)
      {
        query.parent = parent;
      }
      Menu.find(query, function (err, docs) {
        res.send(err?[err]:docs);
      });
    })
    .post(function (req, res) {

    });

module.exports = router;
