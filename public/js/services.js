angular.module('EventApp')

  .factory('authInterceptor', ['$window', function ($window) {

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

  .factory('User', [ '$http', '$q', 'Utils', function ($http, $q, Utils) {

    return {
      isLoggedIn: function () {
        return localStorage.jwt ? true : false;
      },

      isAdmin: function () {
        return localStorage['user_role'] === '管理员' ? true : false;
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
              localStorage.jwt = res.jwt;
              localStorage.accounts = res.user.accounts;
              localStorage.user_role = res.user.role;
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
        localStorage.removeItem('user_role');
      }
    }
  } ])

  .factory('Utils', [function () {
    function setHashKey(obj, h) {
      if (h) {
        obj.$$hashKey = h;
      } else {
        delete obj.$$hashKey;
      }
    }

    function baseExtend(dst, objs, deep) {
      var h = dst.$$hashKey;

      for (var i = 0, ii = objs.length; i < ii; ++i) {
        var obj = objs[i];
        if (!angular.isObject(obj) && !angular.isFunction(obj)) continue;
        var keys = Object.keys(obj);
        for (var j = 0, jj = keys.length; j < jj; j++) {
          var key = keys[j];
          var src = obj[key];

          if (deep && angular.isObject(src)) {
            if (!angular.isObject(dst[key])) dst[key] = angular.isArray(src) ? [] : {};
            baseExtend(dst[key], [src], true);
          } else {
            dst[key] = src;
          }
        }
      }

      setHashKey(dst, h);
      return dst;
    }

    return {
      merge: function (dst) {
        return baseExtend(dst, Array.prototype.slice.call(arguments, 1), true);
      },
      getRowQty: function (length, columns) {
        return new Array(Math.ceil(length / columns));
      },
      getItemsByRow: function (array, columns, rowIndex) {
        var start = columns * rowIndex;
        return array.slice(start, start + columns);
      }
    };
  } ])

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
            callback(null, result)
          })
          .error(function (result) {
            callback(result)
          });
    }
  }]);