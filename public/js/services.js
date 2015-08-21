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