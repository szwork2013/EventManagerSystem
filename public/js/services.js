angular.module('DistApp')

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
          $window.alert('Log in overtime, Please Re-login!');
          delete $window.localStorage.jwt;
          $window.location.href = '/';
          return;
        }
        return $q.reject(rejection);
      }
    };
  } ])

  .factory('User', [ '$http', '$q', 'Utils', function ($http, $q, Utils) {
    var account;
    var getAccount = function (type) {
      if (!account)  return {};
      if(!type) return Utils.merge({}, account);

      switch (type) {
        case 'base':
          return {
            name: account.name,
            website: account.website,
            logo: account.logo,
            address: Utils.merge({}, account.address)
          };
        case 'express':
          return {
            expressCourier: Utils.merge([], account.expressCourier)
          };
        case 'social':
          return {
            socialAccount: Utils.merge([], account.socialAccount)
          };
        case 'billing':
          return {
            billingAddress: Utils.merge([], account.billingAddress)
          };
        case 'shipping':
          return {
            shippingAddress: Utils.merge([], account.shippingAddress)
          };
        case 'coupon':
          return {
            coupon: Utils.merge([], account.coupon)
          };
      }
    };

    return {
      isLoggedIn: function () {
        return localStorage.jwt ? true : false;
      },

      login: function (email, password) {
        return $q(function (resolve, reject) {
          $http
            .post('/api/user/login', {
              email: email,
              password: password
            })
            .success(function (res) {
              if (res.error) {
                switch (res.error) {
                  case 400:
                    reject('Illegal request.');
                    break;
                  case 401:
                    reject('Email or password is not correct.');
                    break;
                  case 403:
                    reject('Email is forbidden');
                    break;
                  case 500:
                    reject('Internal server error. Please try again later.');
                    break;
                  default:
                    reject('Unknown error. Please try again later.');
                }
                return;
              }
              localStorage.jwt = res.jwt;
              localStorage.customer_email = res.customer.email;
              localStorage.customer_name = res.customer.name;
              resolve();
            })
            .error(function () {
              reject('Can not connect to server. Please try again later.');
            });
        });
      },

      logout: function () {
        account = null;
        localStorage.removeItem('jwt');
        localStorage.removeItem('customer_email');
        localStorage.removeItem('customer_name');
      },

      getAccount: function (type) {
        return $q(function (resolve, reject) {
          if (account) {
            resolve(getAccount(type));
            return;
          }

          $http.get('/api/user/account')
            .success(function (res) {
              if (res.error) {
                switch (res.error) {
                  case 404:
                    reject('Account does not exist.');
                    break;
                  case 500:
                    reject('Internal server error. Please try again later.');
                    break;
                  default:
                    reject('Unknown error. Please try again later.');
                }
                return;
              }

              account = res;
              resolve(getAccount(type));
            })
            .error(function () {
              reject('Can not connect to server. Please try again later.');
            });
        });
      },

      saveAccount: function (data) {
        return $q(function (resolve, reject) {
          $http.post('/api/user/account', data)
            .success(function (res) {
              if (res.error) {
                switch (res.error) {
                  case 400:
                    reject('Illegal request.');
                    break;
                  case 404:
                    reject('Account does not exist.');
                    break;
                  case 500:
                    reject('Internal server error. Please try again later.');
                    break;
                  default:
                    reject('Unknown error. Please try again later.');
                }
                return;
              }

              angular.extend(account, data);
              resolve();
            })
            .error(function () {
              reject('Can not connect to server. Please try again later.');
            });
        });
      }
    }
  } ])

  .factory('Product',['$resource',function($resource){
    return $resource('/api/product/recommend');
  }])

  .factory('Order', [ '$resource', function ($resource) {
    return $resource('/api/order/:id', { id: '@_id' });
  } ])

  .factory('RmaItem', [ '$resource', function ($resource) {
    return $resource('/api/rma/item/:id', { id: '@_id' });
  } ])

  .factory('RmaParcel', [ '$resource', function ($resource) {
    return $resource('/api/rma/parcel/:id', { id: '@_id' });
  } ])

  .factory('Quote',[ '$resource','$log', function ($resource,$log) {
    var quote = $resource('/api/quote/:id', { id: '@_id' });

    var getBasePrice = function (product) {
      var price = product.price;
      var tierPrices = product.tier_price;
      var orderedQty = parseInt(product.qty);

      var tierPrice;
      if (orderedQty && tierPrices) {
        angular.forEach(tierPrices, function (item) {
          if (orderedQty < item.price_qty) return;
          if (tierPrice && tierPrice.price_qty > item.price_qty) return;
          tierPrice = item;
        });

      }
      //加上配置产品价格
      return tierPrice ? tierPrice.price : price;
    };

    var getOptionPrice = function (product) {
      var orderedQty = parseInt(product.qty);
      if (!orderedQty)  return 0.0;

      var price = getBasePrice(product);
      angular.forEach(product.options, function (option) {
        if (!option.value) return;

        angular.forEach(option.values, function (value) {
          if (option.value !== value.option_type_id) return;

          if (value.price_type === 'fixed') {
            price += value.price;
          }
          else {
            price += price * value.price / 100;
          }
        });
      });
      price +=  parseFloat(getPriceForChangeConfigurationQty(product));
      price = Math.round(parseFloat(price)*100)/100;
      return price;
    };

    var getPriceForChangeConfigurationQty = function(product){
      var price =0.0;
      var orderedQty = parseInt(product.qty);
      //matt 修改：考虑没有product.tier_price的情况
      if(product.tier_price){
          var tierPrices = product.tier_price;
          for(var i =0;i<tierPrices.length;i++){
            if(tierPrices[i].price_qty <= orderedQty){
              if(product.params && Array.isArray(product.params)){
                angular.forEach(product.params,function(param){
                  price += parseFloat(param.price||0);
                });
              }
              break;
            }
          }
      }
      return price;
    };
    //获取配置产品价格
    var getConfigurationPrice = function(product){
    //  $log.info('product:',product);
      var price =0.0;
      if(Array.isArray(product.attributes)){
        angular.forEach(product.attributes,function(attribute){
          attribute.option = attribute.option ||{};
      //    $log.info('attribute.option:',attribute.option);
          price += Math.round(parseFloat(attribute.option.price||0)*100)/100 ;
        });
      }
      return price;
    };

    var calcPrice = function (product) {//
      var orderedQty = parseInt(product.qty);
      if (!orderedQty)  return 0.0;
      var money =  Math.round(parseFloat(getConfigurationPrice(product)+getOptionPrice(product))*100)/100 * orderedQty;
     // $log.info('money:',money);
      return money;
    };

    var toQuoteItem = function (product) {
      $log.info('product:',product);
      var quoteItem = {
        sku: product.sku,
        name: product.name,
        price: product.price,
        qty: parseInt(product.qty)
      };

      if (product.tier_price) {
        quoteItem.tier_price = [];
        angular.forEach(product.tier_price, function (tierPrice) {
          quoteItem.tier_price.push(angular.extend({}, tierPrice));
        });
      }

      if (product.options) {
        quoteItem.options = [];
        angular.forEach(product.options, function (option) {
          if (!option.value)  return;

          var selectedOption = {
            option_id: option.option_id,
            type: option.type,
            title: option.title,
            values: [],
            value: option.value
          };

          if (option.type === 'drop_down' || option.type === 'radio') {
            angular.forEach(option.values, function (value) {
              if (option.value !== value.option_type_id) return;
              selectedOption.values.push(angular.extend({}, value));
            });
          }

          quoteItem.options.push(selectedOption);
        });
      }

      //配置产品
      if(product.attributes){
        quoteItem.attributes = {};
        quoteItem.params =[];
        var price =0.0;
        angular.forEach(product.attributes,function(attribute){
          quoteItem.attributes[attribute.id] = attribute.option.id;
          //
          quoteItem.params.push({label:attribute.label,price:attribute.option.price,value:(attribute.option.label+' +$'+attribute.option.price)});
          price += parseFloat(attribute.option.price||0);
        });
        quoteItem.price += price;
      }
      //
      $log.info('quoteItem:',quoteItem);
      return quoteItem;
    };

    quote.getBasePrice = getBasePrice;
    quote.getOptionPrice = getOptionPrice;
    quote.calcPrice = calcPrice;
    quote.toQuoteItem = toQuoteItem;

    return quote;
  } ])

  .factory('Utils', [ 'Quote', function (Quote) {
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

    var countries = [
      "Afghanistan","Åland Islands","Albania","Algeria","American Samoa","Andorra",
      "Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia",
      "Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh",
      "Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia",
      "Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil",
      "British Indian Ocean Territory","British Virgin Islands","Brunei","Bulgaria",
      "Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde",
      "Cayman Islands","Central African Republic","Chad","Chile","China",
      "Christmas Island","Cocos [Keeling] Islands","Colombia","Comoros",
      "Congo - Brazzaville","Congo - Kinshasa","Cook Islands","Costa Rica",
      "Côte d’Ivoire","Croatia","Cuba","Cyprus","Czech Republic","Denmark",
      "Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador",
      "Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands",
      "Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia",
      "French Southern Territories","Gabon","Gambia","Georgia","Germany","Ghana",
      "Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala",
      "Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands",
      "Honduras","Hong Kong SAR China","Hungary","Iceland","India","Indonesia",
      "Iran","Iraq", "Ireland","Isle of Man","Israel","Italy","Jamaica","Japan",
      "Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
      "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein",
      "Lithuania","Luxembourg","Macau SAR China","Macedonia","Madagascar",
      "Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Martinique",
      "Mauritania","Mauritius","Mayotte","Mexico","Micronesia","Moldova","Monaco",
      "Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar [Burma]",
      "Namibia","Nauru","Nepal","Netherlands","Netherlands Antilles","New Caledonia",
      "New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island",
      "Northern Mariana Islands","North Korea","Norway","Oman","Pakistan","Palau",
      "Palestinian Territories","Panama","Papua New Guinea","Paraguay","Peru",
      "Philippines","Pitcairn Islands","Poland","Portugal","Puerto Rico","Qatar",
      "Réunion","Romania","Russia","Rwanda","Saint Barthélemy","Saint Helena",
      "Saint Kitts and Nevis","Saint Lucia","Saint Martin","Saint Pierre and Miquelon",
      "Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe",
      "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore",
      "Slovakia","Slovenia","Solomon Islands","Somalia","South Africa",
      "South Georgia and the South Sandwich Islands","South Korea","Spain",
      "Sri Lanka","Sudan","Suriname","Svalbard and Jan Mayen","Swaziland","Sweden",
      "Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand",
      "Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia",
      "Turkey","Turkmenistan","Turks and Caicos Islands","Tuvalu","Uganda",
      "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
      "U.S. Minor Outlying Islands","U.S. Virgin Islands","Uzbekistan","Vanuatu",
      "Vatican City","Venezuela","Vietnam","Wallis and Futuna","Western Sahara",
      "Yemen","Zambia","Zimbabwe"
    ];

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
      },
      validateAddress: function (address) {
        var required = [
          'firstName', 'lastName', 'street', 'city',
          'region', 'country', 'postcode', 'telephone'
        ];
        return required.every(function (field) {
          return address[field];
        });
      },
      getValuePrice: function (product, value) {
        // fixed
        if (value.price_type === 'fixed') {
          return ' + $' + value.price;
        }
        // percent
        return ' + $' + (Quote.getBasePrice(product) * value.price / 100);
      },
      getSaving: function (newPrice, oldPrice) {
        return 100 - Math.ceil(100 * newPrice / oldPrice);
      },
      getCountries: function () {
        return countries;
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