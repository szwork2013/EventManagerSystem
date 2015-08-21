angular.module('EventApp')

  .controller('IndexCtrl', ['$scope', '$location', '$window', 'User',
    function ($scope, $location, $window, User) {
        $scope.isLoggedIn = User.isLoggedIn;
        $scope.isAdmin = User.isAdmin;
      $scope.user_accounts = localStorage.accounts;
      $scope.user_role_name = localStorage.user_role_name;
      $scope.user_role_permission = localStorage.user_role_permission;
      $scope.submit = function () {
        if (User.isLoggedIn()) {
          User.logout();
          $location.path('/');
          return;
        }

        BootstrapDialog.show({
          title: '登陆',
          message: $('<form class="navbar-form"><div class="form-group"><input id="accounts" type="text" placeholder="账户" class="form-control"></div><br /><br /><div class="form-group"><input id="password" type="password" placeholder="密码" class="form-control"></div></form>'),
          cssClass: 'login-dialog',
          type:BootstrapDialog.TYPE_SUCCESS,
          size:BootstrapDialog.SIZE_SMALL,
          buttons: [{
            label: '登陆',
            cssClass: 'btn-success',
            action: function(dialog){
              var accounts = dialog.getModalBody().find('#accounts').val();
              var password = dialog.getModalBody().find('#password').val();

              if (!accounts || !password) {
                $window.alert('错误! 用户名和密码不能为空!');
                return;
              }
              User.login(accounts, password)
                .then(function () {
                  dialog.close();
                  $scope.user_accounts = localStorage.accounts;
                  $scope.user_role_name = localStorage.user_role_name;
                  $scope.user_role_permission = localStorage.user_role_permission;
                  $location.path('/base');
                })
                .catch(function (err) {
                  $window.alert('错误! ' + err);
                });
            }
          }]
        });
      };
    }
  ])

  .controller('UserManagerCtrl', ['$scope', '$location', '$window', 'User',
    function ($scope, $location, $window, User) {
      if (!User.isLoggedIn()) {
        $location.path('/');
        return;
      }

      User.Rest.query(function (result) {
        if (result.length>0){
          $scope.docs = result;
          console.log($scope.docs);
        }
      });
    }
  ])

  .controller('UserRoleCtrl', ['$scope', '$location', '$window', 'User', 'Role',
    function ($scope, $location, $window, User, Role) {
      if (!User.isLoggedIn()) {
        $location.path('/');
        return;
      }

      Role.query(function (result) {
        if (result.length>0){
          $scope.docs = result;
          console.log($scope.docs);
        }
      });
    }
  ])

  .controller('UserMenuCtrl', ['$scope', '$location', '$window', 'User', 'Menu',
    function ($scope, $location, $window, User, Menu) {
      if (!User.isLoggedIn()) {
        $location.path('/');
        return;
      }

      $scope.saveMenu = function () {

      };

      Menu.Rest.query(function (result) {
        if (result.length>0){
          $scope.docs = result;
          console.log($scope.docs);
        }
      });
    }
  ])

  .controller('AccountCtrl', ['$scope', '$location', '$window', 'User',
    function ($scope, $location, $window, User) {
      if (!User.isLoggedIn()) {
        $location.path('/');
        return;
      }
    }
  ]);