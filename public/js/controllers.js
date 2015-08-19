angular.module('EventApp')

  .controller('IndexCtrl', ['$scope', '$location', '$window', 'User',
    function ($scope, $location, $window, User) {
        $scope.isLoggedIn = User.isLoggedIn;
        $scope.isAdmin = User.isAdmin;
      $scope.user_accounts = localStorage['accounts'];
      $scope.user_role = localStorage['user_role'];
      $scope.submit = function () {
        if (User.isLoggedIn()) {
          User.logout();
          $location.path('/');
          return;
        }

        if (!$scope.accounts || !$scope.password) {
          $window.alert('错误! 用户名和密码不能为空!');
          return;
        }

        User.login($scope.accounts, $scope.password)
          .then(function () {
            $scope.accounts = '';
            $scope.password = '';
              $scope.user_accounts = localStorage['accounts'];
              $scope.user_role = localStorage['user_role'];
            $location.path('/base');
          })
          .catch(function (err) {
            $window.alert('错误! ' + err);
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

  .controller('AccountCtrl', ['$scope', '$location', '$window', 'User',
    function ($scope, $location, $window, User) {
      if (!User.isLoggedIn()) {
        $location.path('/');
        return;
      }

      var load = function () {
        User.getRole($scope.user_role)
          .then(function (account) {
              console.log(account);
            $scope.account = account;
            account.logo && logoRender(account.logo);
          })
          .catch(function (err) {
            $window.alert('Error! ' + err);
          });
      };
    }
  ]);