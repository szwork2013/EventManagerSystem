angular.module('EventApp', [ 'ngRoute', 'ngResource'])

  .config([ '$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
      $routeProvider
          .when('/', {
            templateUrl: 'view/index.html'
          })
          .when('/base', {
            templateUrl: 'view/base.html',
            controller: 'AccountCtrl'
          })
          .when('/manager', {
            templateUrl: 'view/user/manager.html',
            controller: 'UserManagerCtrl'
          })
          .when('/role', {
            templateUrl: 'view/user/role.html',
            controller: 'UserRoleCtrl'
          })
          .when('/menu', {
              templateUrl: 'view/user/menu.html',
              controller: 'UserMenuCtrl'
          })
          .when('/event', {
              templateUrl: 'view/event/list.html',
              controller: 'EventListCtrl'
          })
          .otherwise('/');

      $httpProvider.interceptors.push('authInterceptor');
  } ]);
angular.module('EventApp')

  .factory('authInterceptor', ['$window', function ($window, $resource) {

    return {
      request: function (config) {
        config.headers = config.headers || {};
        if (localStorage.jwt) {
          config.headers.Authorization = 'Bearer ' + localStorage.jwt;
        }
        return config;
      },
      responseError: function (rejection) {
        console.log('responseError rejection:', rejection);
        if (rejection.status === 401) {
          $window.alert('登陆超时,请重新登陆');
          delete $window.localStorage.jwt;
          $window.location.href = '/';
          return;
        }
        return $q.reject(rejection);
      }
    };
  } ])

  .factory('User', [ '$http', '$q', '$resource', function ($http, $q, $resource) {

    return {
      isLoggedIn: function () {
        return localStorage.jwt ? true : false;
      },

      isAdmin: function () {
        return localStorage.user_role_name === '管理员' ? true : false;
      },

      login: function (accounts, password) {
        return $q(function (resolve, reject) {
          $http
            .post('/api/user/login', {
              accounts: accounts,
              password: password
            })
            .success(function (res) {
              if (res.error) {
                switch (res.error) {
                  case 400:
                    reject('用户名和密码不能未空.');
                    break;
                  case 401:
                    reject('用户名或密码错误.');
                    break;
                  case 500:
                    reject('Http错误. 请稍后重试.');
                    break;
                  default:
                    reject(res.msg);
                }
                return;
              }
                console.log(res);
              localStorage.jwt = res.jwt;
              localStorage.accounts = res.user.accounts;
              localStorage.user_role_name = res.user.role.name;
              localStorage.user_role_permission = res.user.role.permission;
              resolve();
            })
            .error(function () {
              reject('服务器连接失败. 请稍后重试.');
            });
        });
      },

      logout: function () {
        localStorage.removeItem('jwt');
        localStorage.removeItem('accounts');
        localStorage.removeItem('user_role_name');
        localStorage.removeItem('user_role_permission');
      },

      Rest:$resource('/api/user/manager/:id', {id:'@_id'})
    };
  } ])

    .factory('Role',[ '$resource', function ($resource) {
     return $resource('/api/user/role/:id', {id:'@_id'});
    }])

    .factory('Menu',[ '$resource', function ($resource) {
      return {
        Rest:$resource('/api/user/menu/:id', {id:'@_id'})
      };
    }])

  .service('fileUpload', ['$http',
  function ($http) {
    this.uploadFileToUrl = function (fd, uploadUrl, callback) {

      $http.post(uploadUrl, fd, {
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      })
          .success(function (result) {
            callback(null, result);
          })
          .error(function (result) {
            callback(result);
          });
    };
  }]);
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