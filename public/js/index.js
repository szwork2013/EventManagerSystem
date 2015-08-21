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