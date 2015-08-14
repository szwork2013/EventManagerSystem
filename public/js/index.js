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
      .otherwise('/');

    $httpProvider.interceptors.push('authInterceptor');
  } ]);