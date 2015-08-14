angular.module('DistApp', [ 'ngRoute', 'ngResource', 'ngMap' ])

  .config([ '$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'view/index.html'
      })
      .when('/account/base', {
        templateUrl: 'view/account-base.html',
        controller: 'AccountCtrl'
      })
      .when('/account/express', {
        templateUrl: 'view/account-express.html',
        controller: 'AccountCtrl'
      })
      .when('/account/social', {
        templateUrl: 'view/account-social.html',
        controller: 'AccountCtrl'
      })
      .when('/account/billing', {
        templateUrl: 'view/account-billing.html',
        controller: 'AccountCtrl'
      })
      .when('/account/shipping', {
        templateUrl: 'view/account-shipping.html',
        controller: 'AccountCtrl'
      })
      .when('/account/coupon', {
        templateUrl: 'view/account-coupon.html',
        controller: 'AccountCtrl'
      })
      .when('/order', {
        templateUrl: 'view/order-list.html',
        controller: 'OrderListCtrl'
      })
      .when('/order/success', {
        templateUrl: 'view/order-success.html',
        controller: 'CreateOrderSuccessCtrl'
      })
      .when('/order/cancel', {
        templateUrl: 'view/order-cancel.html'
      })
      .when('/order/:id', {
        templateUrl: 'view/order-detail.html',
        controller: 'OrderDetailCtrl'
      })
      .when('/rma-item', {
        templateUrl: 'view/rma-item-list.html',
        controller: 'RmaItemListCtrl'
      })
      .when('/rma-item/:id', {
        templateUrl: 'view/rma-item-detail.html',
        controller: 'RmaItemDetailCtrl'
      })
      .when('/rma-parcel', {
        templateUrl: 'view/rma-parcel-list.html',
        controller: 'RmaParcelListCtrl'
      })
      .when('/rma-parcel/:id', {
        templateUrl: 'view/rma-parcel-detail.html',
        controller: 'RmaParcelDetailCtrl'
      })
      .when('/create/order', {
        templateUrl: 'view/create-order.html',
        controller: 'CreateOrderCtrl'
      })
      .when('/create/order/cart', {
        templateUrl: 'view/create-order-cart.html',
        controller: 'CreateOrderCartCtrl'
      })
      .when('/create/order/checkout', {
        templateUrl: 'view/create-order-checkout.html',
        controller: 'CreateOrderCheckoutCtrl'
      })
      .when('/create/rma-item', {
        templateUrl: 'view/create-rma-item.html',
        controller: 'CreateRmaItemCtrl'
      })
      .when('/create/rma-parcel', {
        templateUrl: 'view/create-rma-parcel.html',
        controller: 'CreateRmaParcelCtrl'
      })
      .when('/order/check_money/:id',{
        templateUrl: 'view/order-checkmoney.html',
        controller:'OrderCheckMoneyCtrl'
      })
      .otherwise('/');

    $httpProvider.interceptors.push('authInterceptor');
  } ]);