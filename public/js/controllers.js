angular.module('DistApp')

  .controller('IndexCtrl', ['$scope', '$location', '$window', 'User',
    function ($scope, $location, $window, User) {
      $scope.isLoggedIn = User.isLoggedIn;
      $scope.userEmail = localStorage['customer_email'];
      $scope.submit = function () {
        if (User.isLoggedIn()) {
          User.logout();
          $location.path('/');
          return;
        }

        if (!$scope.email || !$scope.password) {
          $window.alert('Error! Email and password are required!');
          return;
        }

        User.login($scope.email, $scope.password)
          .then(function () {
            $scope.email = '';
            $scope.password = '';
            $location.path('/account/base');
          })
          .catch(function (err) {
            $window.alert('Error! ' + err);
          });
      };
    }
  ])

  .controller('AccountCtrl', ['$scope', '$location', '$window', 'User', 'Utils',
    function ($scope, $location, $window, User, Utils) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      // valid types: base, express, social, billing, shipping, coupon
      var type = $location.path().substr($location.path().lastIndexOf('/') + 1);
      console.log(type);
      var load = function () {
        User.getAccount(type)
          .then(function (account) {
              console.log(account);
            $scope.account = account;
            account.logo && logoRender(account.logo);
          })
          .catch(function (err) {
            $window.alert('Error! ' + err);
          });
      };

      $scope.editable = false;
      $scope.submitting = false;
      $scope.countries = Utils.getCountries();

      $scope.toggleEdit = function () {
        if ($scope.editable) {
          load();
        }
        $scope.editable = !$scope.editable;
      };

      $scope.setDefault = function (objList, objIndex) {
        angular.forEach(objList, function (obj, index) {
          obj.isDefault = (index === objIndex);
        });
      };

      $scope.add = function (objList) {
        objList.push({});
      };

      $scope.remove = function (objList, objIndex) {
        objList.splice(objIndex, 1);
      };

      $scope.submit = function () {
        if (!$scope.account) {
          $window.alert('Error! Invalid data');
          return;
        }
        //判断express 里是否有空值
        var i,flag=false,expressCourier = $scope.account.expressCourier||[];
        for(i=0;i<expressCourier.length;i++){
          if(!expressCourier[i].name || !expressCourier[i].account){
            flag = true;
            break;
          }
        }
        if(flag){
          $window.alert('Error! Express Account Courier and  Account must not be empty');
          return;
        }

        $scope.submitting = true;
        User.saveAccount($scope.account)
          .then(function () {
            $scope.editable = false;
            $window.alert('Bravo! You changes have been saved!');
          })
          .catch(function (err) {
            $window.alert('Error! ' + err);
          })
          .finally(function () {
            $scope.submitting = false;
          });
      };

      // load account data
       load();
      //处理上传图片文件
        // 渲染logo
        function logoRender(src){
            var MAX_HEIGHT = 100;
            var MAX_WIDTH = 200;
            var image = new Image();
            image.onload = function(){
                var canvas = document.getElementById("logoCanvas");
                console.log(canvas);
                // 如果宽高度超标
                if(image.height > MAX_HEIGHT) {
                    // 宽度等比例缩放 *=
                    image.width *= MAX_HEIGHT / image.height;
                    image.height = MAX_HEIGHT;
                }
                if(image.width > MAX_WIDTH) {
                    // 高度等比例缩放 *=
                    image.height *= MAX_WIDTH / image.width;
                    image.width = MAX_WIDTH;
                }
                var ctx = canvas.getContext("2d");
                // canvas清屏
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // 重置canvas宽高
                canvas.width = image.width;
                canvas.height = image.height;
                // 将图像绘制到canvas上
                ctx.drawImage(image, 0, 0, image.width, image.height);
                //返回canvas裁切后的图像数据
                $scope.account.logo = canvas.toDataURL();
            };
            // 设置src属性，浏览器会自动加载。
            // 记住必须先绑定事件，才能设置src属性，否则会出同步问题。
            image.src = src;
        };
      var logoWatch = $scope.$watch('logoUpload',function(newValue,oldValue, scope){
            logoRender(newValue);
      });
      //google map
        


      var $activeProductEl = angular.element('#googleMap');
      $scope.showPicker = function () {
            $activeProductEl.modal('show');
       };
      var map,marker;
      $scope.$on('mapInitialized', function(evt, evtMap) {
          map = evtMap;
          
          //use latLng
          if($scope.account.address.latitude && $scope.account.address.longitude){
              var accountLatlng = new google.maps.LatLng($scope.account.address.latitude, $scope.account.address.longitude);
              moveMarker(accountLatlng);
              map.panTo(accountLatlng);
          }
          //use address
          
          //use html5 location
          
          //search bar
          $scope.types = "['establishment']";
          $scope.placeChanged = function() {
              if(!$scope.editable || $scope.submitting){
                  return;
              }
              $scope.place = this.getPlace();
              map.panTo($scope.place.geometry.location);
          }
          //submit the location
          $scope.placeChangedSubmit = function() {
              if(!$scope.editable || $scope.submitting){
                  return;
              }
              moveMarker($scope.place.geometry.location);
          }
         
          //click select
          $scope.placeMarker = function(e) {
              if(!$scope.editable || $scope.submitting){
                  return;
              }
              moveMarker(e.latLng);
              map.panTo(e.latLng);
          }
          
          function moveMarker(latLng){
              if(marker){
                  marker.setPosition(latLng);
              }else{
                  marker = new google.maps.Marker({position: latLng, map: map});
              }
              //matt 修改：使用google官方的方法获取经纬度
              $scope.account.address.latitude = marker.getPosition().lat();
              $scope.account.address.longitude = marker.getPosition().lng();
          }
      });
    }
  ])

  .controller('OrderListCtrl', ['$scope', '$location', '$window', 'User', 'Order',
    function ($scope, $location, $window, User, Order) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      $scope.createOrder = function () {
        $location.path('/create/order');
      };

      var itemState = {
        PENDING: 'pending',
        PROCESSING: 'processing',
        COMPLETE: 'complete'
      };

      $scope.State = itemState;

      $scope.getState = function (order) {
        if (!order.processing)  return itemState.PENDING;
        if (order.complete) return itemState.COMPLETE;
        return itemState.PROCESSING;
      };

      Order.query(function (orders) {
        $scope.orders = orders;
      }, function () {
        $window.alert('Error! Can not connect to server. Please try again later.');
      });
    }
  ])

  .controller('OrderDetailCtrl', ['$scope', '$location', '$window',
    '$routeParams', 'User', 'Order','Quote',
    function ($scope, $location, $window, $routeParams, User, Order,Quote) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      var itemState = {
        PENDING: 'pending',
        PROCESSING: 'processing',
        COMPLETE: 'complete'
      };

      $scope.State = itemState;
      $scope.submitting = false;

      $scope.getOptionPrice = function (quote) {
        return Quote.getOptionPrice(quote);
      };

      $scope.calcPrice = function (quote) {
        return Quote.calcPrice(quote);
      };

      $scope.getState = function (order) {
        if (!order) return;
        if (!order.processing)  return itemState.PENDING;
        if (order.complete) return itemState.COMPLETE;
        return itemState.PROCESSING;
      };

      $scope.cancelOrder = function () {
        if ($scope.order.processing) return;

        if (!$window.confirm('You sure want to cancel the order?')) return;

        $scope.submitting = true;
        $scope.order.$remove()
          .then(function (res) {
            if (res.error) {
              $window.alert('Cancel order failed. Please try again later.');
              return;
            }

            $location.path('/order');
          })
          .catch(function () {
            $window.alert('Error! Can not connect to server. Please try again later.');
          })
          .finally(function () {
            $scope.submitting = false;
          });
      };

      $scope.isDisableFulfillPayment = function(){
        var order = $scope.order;
        //console.info('order:',order);
        if(!order.processing){
          var createdAt = order.createdAt;
          if(createdAt.valueOf() + 30*60*1000 >Date.now()){
            return true;
          }

        }
          return false;

      };

      $scope.fulfillPayment = function () {
       // console.info('$scope.order.paymentUrl:', $scope.order.paymentUrl);
        $window.alert('You will be redirected to PayPal website to fulfill payment.');
        $window.location.href = $scope.order.paymentUrl;
      };

      Order.get({id: $routeParams.id}, function (res) {
        if (res.error) {
          switch (res.error) {
            case 403:
              $window.alert('Illegal request.');
              break;
            case 404:
              $window.alert('Order does not exist.');
              break;
            case 500:
              $window.alert('Internal server error. Please try again later.');
              break;
            default:
              $window.alert('Unknown error. Please try again later.');
          }
          return;
        }

        $scope.order = res;
        var order = $scope.order;
       // console.info('order:',order);
        if(!order.processing){
          var createdAt = order.createdAt;
         // console.info('createdAt.valueOf():',new Date(createdAt).getTime());
         //// console.info('Date.now():',Date.now());
         // console.info('(new Date(createdAt).getTime() + 30*60*1000 < (new Date().getTime()):',((new Date(createdAt).getTime() + 30*60*1000 < Date.now())));
            $scope.isDisableFulfillPayment = (new Date(createdAt).getTime() + 30*60*1000 < Date.now());
        }

      }, function () {
        $window.alert('Error! Can not connect to server. Please try again later.');
      });
    }
  ])

  .controller('RmaItemListCtrl', ['$scope', '$http', '$location', '$window', 'User', 'RmaItem', 'fileUpload', 'freshdeskUrl',
    function ($scope, $http, $location, $window, User, RmaItem, fileUpload, freshdeskUrl) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      var itemState = {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        USED: 'used'
      };

      var ticket = {
        email: '',
        subject: 'My rma item has been rejected, I have some question.',
        description: '',
        ticket_type: 'Tech Support' //需要与市场部确认如何修改ticket类型
      };

      $scope.freshdeskUrl = freshdeskUrl;

      $scope.State = itemState;

      $scope.getState = function (item) {
        if (item.rmaParcel) return itemState.USED;
        if (item.approved) return itemState.APPROVED;
        if (item.rejected) return itemState.REJECTED;
        return itemState.PENDING;
      };

      $scope.createRmaItem = function(){
        $location.path('/create/rma-item');
      };

      $scope.createParcel = function(){
        $location.path('/create/rma-parcel');
      };

      $scope.createTicket = function (item) {
        ticket.rmaItem = item;
        $scope.ticket = ticket;
      };

      $scope.saveTicket = function () {
        ticket.description = $scope.ticket.description;
        var fd = new FormData();
        fd.append('email', localStorage.customer_email);
        fd.append('subject', ticket.subject);
        fd.append('description', ticket.description);
        fd.append('ticket_type', ticket.ticket_type);
        fileUpload.uploadFileToUrl(fd, '/api/ticket/create', function (err, result) {

          if (err) {
            //$window.alert('提交ticket工单出错了，服务器返回'+err);
            return;
          }
          if (result.error) {
            //$window.alert('提交ticket工单出错了，服务器返回：' + result.error);
            return;
          }
          if (!result.ticketId) {
            //$window.alert('提交ticket工单出错了，没有返回正确的工单号，需进入freshdesk确定工单是否创建成功或重试。');
            return;
          }

          //更新列表
          $window.alert('submit ticket saving ticketId.....');
          //将ticket保存到item
          $scope.submitting = true;
          $http.post('/api/rma/item/' + ticket.rmaItem._id, {ticketId: result.ticketId})
              .success(function (res) {
                if (res.error) {
                  switch (res.error) {
                    case 400:
                    case 403:
                      $window.alert('Illegal request.');
                      break;
                    case 404:
                      $window.alert('RMA parcel does not exist.');
                      break;
                    case 500:
                      $window.alert('Internal server error. Please try again later.');
                      break;
                    default:
                      $window.alert('Unknown error. Please try again later.');
                  }
                  return;
                }

                $window.alert('Bravo! You changes have been saved!');
                $('#modal_create_ticket').modal('toggle');
              })
              .error(function () {
                $window.alert('Error! Can not connect to server. Please try again later.');
              })
              .finally(function () {
                $scope.submitting = false;
                RmaItem.query(function (items) {
                  $scope.rmaItems = items;
                }, function () {
                  $window.alert('Error! Can not connect to server. Please try again later.');
                });
              });
        });
      };

      $scope.remove = function (item) {
        if (!$window.confirm('You do want to delete this item?')) return;

        item.$remove(function (res) {
          if (res.error) {
            switch (res.error) {
              case 403:
                $window.alert('Illegal request.');
                break;
              case 404:
                $window.alert('RMA item does not exist.');
                break;
              case 500:
                $window.alert('Internal server error. Please try again later.');
                break;
              default:
                $window.alert('Unknown error. Please try again later.');
            }
            return;
          }

          var index = $scope.rmaItems.indexOf(item);
          if (index === -1) return;

          $scope.rmaItems.splice(index, 1);
        }, function () {
          $window.alert('Error! Can not connect to server. Please try again later.');
        })
      };

      RmaItem.query(function (items) {
        $scope.rmaItems = items;
      }, function () {
        $window.alert('Error! Can not connect to server. Please try again later.');
      });
    }
  ])

  .controller('RmaItemDetailCtrl', ['$scope', function ($scope) {
    // seems not necessary
  }])

  .controller('RmaParcelListCtrl', ['$scope', '$location', '$window', 'User', 'RmaParcel',
    function ($scope, $location, $window, User, RmaParcel) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      var itemState = {
        CREATED: 'created',
        SENT: 'sent',
        RECEIVED: 'received',
        COMPLETE: 'complete'
      };

      $scope.State = itemState;

      $scope.createRmaParcel = function(){
        $location.path('/create/rma-parcel');
        return;
      };

      $scope.getState = function (parcel) {
        if (parcel.complete) return itemState.COMPLETE;
        if (parcel.received) return itemState.RECEIVED;
        if (parcel.sent) return itemState.SENT;
        return itemState.CREATED;
      };

      $scope.getExtra = function (parcel) {
        if (parcel.complete)  return parcel.solution;
        if (parcel.sent) {
          var track = parcel.track;
          return track ? (track.courier + ': ' + track.number) : '';
        }
      };

      $scope.view = function (parcel) {
        $location.path('/rma-parcel/' + parcel._id);
      };

      $scope.remove = function (parcel) {
        if (!$window.confirm('You do want to delete this parcel?')) return;

        parcel.$remove(function (res) {
          if (res.error) {
            switch (res.error) {
              case 403:
                $window.alert('Illegal request.');
                break;
              case 404:
                $window.alert('RMA parcel does not exist.');
                break;
              case 500:
                $window.alert('Internal server error. Please try again later.');
                break;
              default:
                $window.alert('Unknown error. Please try again later.');
            }
            return;
          }

          var index = $scope.rmaParcels.indexOf(parcel);
          if (index === -1) return;

          $scope.rmaParcels.splice(index, 1);
        }, function () {
          $window.alert('Error! Can not connect to server. Please try again later.');
        })
      };

      RmaParcel.query(function (parcels) {
        $scope.rmaParcels = parcels;
      }, function () {
        $window.alert('Error! Can not connect to server. Please try again later.');
      });
    }
  ])

  .controller('RmaParcelDetailCtrl', ['$scope', '$location', '$window',
    '$routeParams', 'User', 'RmaParcel', '$http',
    function ($scope, $location, $window, $routeParams, User, RmaParcel, $http) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      $scope.backToList = function () {
        $location.path('/rma-parcel');
      };

      $scope.submitting = false;
      /* 退货包裹流程 未发货 */
      $scope.reset = function () {
        $scope.track = null;
      };

      $scope.submit = function () {
        var track = $scope.track;
        if (!track || !track.courier || !track.number) {
          $window.alert('Error! Please input courier name and tracking number.');
          return;
        }

        $scope.submitting = true;
        $http.post('/api/rma/parcel/' + $scope.parcel._id, {track: track})
          .success(function (res) {
            if (res.error) {
              switch (res.error) {
                case 400:
                case 403:
                  $window.alert('Illegal request.');
                  break;
                case 404:
                  $window.alert('RMA parcel does not exist.');
                  break;
                case 500:
                  $window.alert('Internal server error. Please try again later.');
                  break;
                default:
                  $window.alert('Unknown error. Please try again later.');
              }
              return;
            }

            $window.alert('Bravo! You changes have been saved!');
            angular.extend($scope.parcel, res);
          })
          .error(function () {
            $window.alert('Error! Can not connect to server. Please try again later.');
          })
          .finally(function () {
            $scope.submitting = false;
          })
      };
      /* 退货包裹流程 已发货*/
      $scope.trackChange = function (){
        $scope.submitting = true;
        $http.post('/api/rma/parcel/' + $scope.parcel._id, {track: {}})
            .success(function (res) {
              if (res.error) {
                switch (res.error) {
                  case 400:
                    $window.alert('400');
                    break;
                  case 403:
                    $window.alert('Illegal request.');
                    break;
                  case 404:
                    $window.alert('RMA parcel does not exist.');
                    break;
                  case 500:
                    $window.alert('Internal server error. Please try again later.');
                    break;
                  default:
                    $window.alert('Unknown error. Please try again later.');
                }
                return;
              }
              angular.extend($scope.parcel, res);
              $scope.track.courier = '';
              $scope.track.number = '';
            })
            .error(function () {
              $window.alert('Error! Can not connect to server. Please try again later.');
            })
            .finally(function () {
              $scope.submitting = false;
            })
      };

      RmaParcel.get({id: $routeParams.id}, function (res) {
        if (res.error) {
          switch (res.error) {
            case 403:
              $window.alert('Illegal request.');
              break;
            case 404:
              $window.alert('RMA parcel does not exist.');
              break;
            case 500:
              $window.alert('Internal server error. Please try again later.');
              break;
            default:
              $window.alert('Unknown error. Please try again later.');
          }
          return;
        }

        $scope.parcel = res;
      }, function () {
        $window.alert('Error! Can not connect to server. Please try again later.');
      });
    }
  ])

  .controller('CreateOrderCtrl', ['$scope', '$location', '$window',
    'User', '$http', 'Quote', 'Utils', '$log','Product',
    function ($scope, $location, $window, User, $http, Quote, Utils, $log,Product) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      $scope.submitting = false;
      $scope.products = [];

      $scope.getRowQty = Utils.getRowQty;
      $scope.getItemsByRow = Utils.getItemsByRow;

      var $activeProductEl = angular.element('#activeProduct');
      $scope.view = function (product) {
        product.qty = product.qty || 1;
        $scope.activeProduct = product;
        $activeProductEl.modal('show');
      };

      $scope.getValuePrice = Utils.getValuePrice;

      $scope.getSaving = Utils.getSaving;

      $scope.calcPrice = function (product) {
        if (!product)  return 0.0;
        return Quote.calcPrice(product);
      };

      $scope.addToCart = function (product) {
        var qty = parseInt(product.qty);
        if (!qty || qty <= 0) {
          $window.alert('Qty must be greater than 0.');
          return;
        }
        if (qty > product.stock_qty && product.backorders === '0') {
          $window.alert('Sorry, we don\'t have enough stock, and backorder is disabled.');
          return;
        }

        if (product.options && product.options.some(function (option) {
            return option.is_require && !option.value;
          })) {
          $window.alert('Please specify all required forms.');
          return;
        }

        $scope.submitting = true;
        Quote.save(Quote.toQuoteItem(product), function (res) {
          if (res.error) {
            switch (res.error) {
              case 400:
                $window.alert('Illegal request.');
                break;
              case 500:
                $window.alert('Internal server error. Please try again later.');
                break;
              default:
                $window.alert('Unknown error. Please try again later.');
            }
            return;
          }

          $scope.submitting = false;
          $activeProductEl.modal('hide');
          $window.alert('Bravo! Product is added to cart.');
        }, function (err) {
          $scope.submitting = false;
          $window.alert('Can not connect to server. Please try again later.');
        });
      };

      $scope.search = function () {
        var key = $scope.key; //搜索关键字
        var params ={};
        if(/(IM)?\d{4,9}$/.test(key)){
          params.sku = key;
        }else{
          params.name = key;
        }
        $log.info('params:',params);
        if ($scope.key.length < 4) {
          $window.alert('Please specify at least 6 chars.');
          return;
        }

        $scope.submitting = true;
        $http.get('/api/search/product', {params: params})
          .success(function (res) {
            if (res.error) {
              switch (res.error) {
                case 400:
                  $window.alert('Illegal request.');
                  break;
                case 500:
                  $window.alert('Internal server error. Please try again later.');
                  break;
                default:
                  $window.alert('Unknown error. Please try again later.');
              }
              return;
            }

            res = res.filter(function (item) {
              // Only display simple products
              return item['type_id'] === 'simple' || 'configurable';
            });
            $scope.products = res;
          })
          .error(function () {
            $window.alert('Error! Can not connect to server. Please try again later.');
          })
          .finally(function () {
            $scope.submitting = false;
          });
      };

      $scope.isDisableAddToCart = function(activeProduct){
        if(!activeProduct.attributes || !Array.isArray(activeProduct.attributes)){
          return false;
        }
        var i,flag = false;
        for(i=0;i<activeProduct.attributes.length;i++){
        //  $log.info(i,activeProduct.attributes[i].option);
          if(!activeProduct.attributes[i].option.id){
            flag = true;
            break;
          }
        }
        return flag;

      };
      $scope.filterOptions = function (option ,index) {
       //配置产品过滤选项
       // $log.info('option:', option);
       // $log.info('index:', index);
        var attributes = $scope.activeProduct.attributes;
        $scope.activeProduct.attributes.products = $scope.activeProduct.attributes.products ||[];
        var temIndex;
        //从0开始检测
        /**
         * 如果index =0 ,则更新临时值，并禁用掉一些不可选的
         * */
        if(index ===0){
          $scope.activeProduct.attributes.products = option.products;
        }
        $log.info('init products:',$scope.activeProduct.attributes.products);
        //
        while(++index < attributes.length){
          //$log.info('attributes[index+1].options before:',attributes[index].options);
          attributes[index].options= attributes[index].options.map(function(item){
            var i;
            item.disabled= true;
            item.products = item.products||[];
            $log.info('item.products:',item.products);
            $log.info('products:',$scope.activeProduct.attributes.products);
            for(i = 0;i<item.products.length;i++){
              if($scope.activeProduct.attributes.products.indexOf(item.products[i])>-1 && option.products.indexOf(item.products[i])> -1){
                item.disabled= false;
                break;
              }
            }
            return item;
          });
        }
      };

      var getRecommendProduct = function(){
        Product.query(function(data){
          $log.info('getRecommendProduct:',data);
          $scope.products = data;
        });

      };
      $scope.getRecommendProduct = getRecommendProduct;
      getRecommendProduct();
    }
  ])

  .controller('CreateOrderCartCtrl', ['$scope', '$location', '$window',
    'User', '$http', 'Quote',
    function ($scope, $location, $window, User, $http, Quote) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      $scope.submitting = false;

      $scope.getOptionPrice = function (quote) {
        return Quote.getOptionPrice(quote);
      };

      $scope.calcPrice = function (quote) {
        return Quote.calcPrice(quote);
      };

      $scope.getGrandTotal = function (quotes) {
        if (!quotes || quotes.length === 0) return 0.0;

        var total = 0;
        quotes.forEach(function (quote) {
          total += Quote.calcPrice(quote);
        });

        total = Math.round(parseFloat(total)*100)/100;
        return total;
      };

      $scope.remove = function (quote) {
        if (!$window.confirm('You do want to delete this quote?')) return;

        quote.$remove(function (res) {
          if (res.error) {
            switch (res.error) {
              case 403:
                $window.alert('Illegal request.');
                break;
              case 404:
                $window.alert('Quote does not exist.');
                break;
              case 500:
                $window.alert('Internal server error. Please try again later.');
                break;
              default:
                $window.alert('Unknown error. Please try again later.');
            }
            return;
          }

          var index = $scope.quotes.indexOf(quote);
          if (index === -1) return;

          $scope.quotes.splice(index, 1);
        }, function () {
          $window.alert('Error! Can not connect to server. Please try again later.');
        });
      };

      $scope.checkout = function () {
        if ($scope.quotes.length === 0) return;

        $scope.submitting = true;
        async.each($scope.quotes, function (quote, callback) {
          var qty = parseInt(quote.qty);
          if (!qty || qty <= 0) {
            callback('Qty of ' + quote.sku + ' must be greater than 0.');
            return;
          }

          if (origQty[quote._id] === qty) {
            callback();
            return;
          }

          $http.post('/api/quote/' + quote._id, {qty: qty})
            .success(function (res) {
              if (res.error) {
                callback('Save shopping cart items failed. Please try again later.');
                return;
              }

              callback();
            })
            .error(function () {
              callback('Error! Can not connect to server. Please try again later.');
            });
        }, function (err) {
          if (err) {
            $scope.submitting = false;
            $window.alert(err);
            return;
          }

          var products = [];
          $scope.quotes.forEach(function (quote) {
            var product = {
              sku: quote.sku,
              qty: parseInt(quote.qty)
            };

            var options = {};
            quote.options.forEach(function (option) {
              options[option.option_id] = '' + option.value;
            });
            if (Object.keys(options).length) {
              product.options = options;
            }
            if(quote.attributes){
              product.super_attribute = quote.attributes;
            }

            products.push(product);
          });

          $http.post('/api/checkout/cart', {products: products})
            .success(function (res) {
              if (res.error) {
                switch (res.error) {
                  case 500:
                    $window.alert('Internal server error. Please try again later.');
                    break;
                  default:
                    $window.alert('Unknown error. Please try again later.');
                }
                return;
              }

              if (res.failed_product && res.failed_product.length !== 0) {
                var errorText = [];
                res.failed_product.forEach(function (failed) {
                  errorText.push(failed.sku + ': ' + failed.msg);
                });
                $window.alert(errorText.join('\n'));
                return;
              }

              $location.path('/create/order/checkout');
            })
            .error(function () {
              $window.alert('Error! Can not connect to server. Please try again later.');
            })
            .finally(function () {
              $scope.submitting = false;
            });
        });
      };

      var origQty = {};
      Quote.query(function (quotes) {
        $scope.quotes = quotes;
        quotes.forEach(function (quote) {
          origQty[quote._id] = quote.qty;
        });
      }, function () {
        $window.alert('Can not connect to server. Please try again later.');
      });
    }
  ])

  .controller('CreateOrderCheckoutCtrl', ['$scope', '$location', '$window',
    'User', '$http', 'Quote', 'Utils',
    function ($scope, $location, $window, User, $http, Quote, Utils) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      $scope.submitting = false;

      $scope.bAddrs = [];
      $scope.sAddrs = [];

      $scope.getRowQty = Utils.getRowQty;
      $scope.getItemsByRow = Utils.getItemsByRow;

      $scope.getSaving = Utils.getSaving;
      $scope.getValuePrice = Utils.getValuePrice;
      $scope.calcPrice = function (product) {
        if (!product)  return 0.0;
        return Quote.calcPrice(product);
      };

      var $bAddrsEl = angular.element('#bAddrs');
      var $sAddrsEl = angular.element('#sAddrs');
      $scope.selectBillingAddress = function () {
        $bAddrsEl.modal('show');
      };
      $scope.selectShippingAddress = function () {
        $sAddrsEl.modal('show');
      };
      $scope.useBillingAddress = function (address) {
        if (!Utils.validateAddress(address)) {
          $window.alert('Error! Incomplete address.');
          return;
        }

        $scope.billingAddress = address;
        $bAddrsEl.modal('hide');
      };
      $scope.useShippingAddress = function (address) {
        if (!Utils.validateAddress(address)) {
          $window.alert('Error! Incomplete address.');
          return;
        }

        $scope.shippingAddress = address;
        $sAddrsEl.modal('hide');
        loadShippingMethods();
      };

      $scope.activeSample = {};
      var $activeSampleEl = angular.element('#activeSample');

      $scope.viewSample = function (sample) {
        sample.qty = 1;
        $scope.activeSample = sample;
        $activeSampleEl.modal('show');
      };

      $scope.selectSample = function (sample) {
        if (sample.options && sample.options.some(function (option) {
            return option.is_require && !option.value;
          })) {
          $window.alert('Please specify all required forms.');
          return;
        }

        // Total price of selected samples must be no more than 10% of whole order
        if (Quote.calcPrice(sample) + calcSampleTotal($scope.samples) > quoteTotal / 10) {
          $window.alert('Sorry! The total price of free samples can not be greater '
            + 'than 10% of the grand total of the whole cart.');
          return;
        }

        sample.selected = true;
        $activeSampleEl.modal('hide');
      };

      var calcSampleTotal = function (samples) {
        var total = 0;
        samples.forEach(function (sample) {
          if (!sample.selected) return;
          total += Quote.calcPrice(sample);
        });
        return total;
      };

      $scope.shippingMethod = {selected: null};
      $scope.shippingMethods = [];
      var loadShippingMethods = function () {
        $http.post('/api/checkout/shipping', {shipping_address: $scope.shippingAddress,billing_address:$scope.billingAddress})
          .success(function (res) {
            if (res.error) {
              switch (res.error) {
                case 500:
                  $window.alert('Internal server error. Please try again later.');
                  break;
                default:
                  $window.alert('Unknown error. Please try again later.');
              }
              return;
            }
              console.log(res);
            if (res){
            res.forEach(function (method) {
              if (method.code === 'customshippingrate_customshippingrate') return;
              $scope.shippingMethods.push({
                title: method.method_title,
                account: 'ITEAD',
                cost: method.price,
                code: method.code
              });
            });
            }
            account.expressCourier.forEach(function (method) {
              if (!method.name || !method.account) return;

              var shippingMethod = {
                title: method.name,
                account: method.account,
                cost: 0,
                code: 'customshippingrate_customshippingrate'
              };
              $scope.shippingMethods.push(shippingMethod);

              if (method.isDefault) {
                $scope.shippingMethod.selected = shippingMethod;
                shippingCost = shippingMethod.cost;
              }
            });
          })
          .error(function () {
            $window.alert('Can not connect to server. Please try again later.');
          });
      };

      $scope.paymentMethod = 'paypal_standard';
      $scope.coupons = [];

      var account;
      User.getAccount()
        .then(function (res) {
          account = res;
          $scope.bAddrs = account.billingAddress;
          $scope.sAddrs = account.shippingAddress;

          account.billingAddress.forEach(function (billingAddress) {
            if (!billingAddress.isDefault
              || !Utils.validateAddress(billingAddress)) {
              return;
            }

            $scope.billingAddress = billingAddress;
          });

          account.shippingAddress.forEach(function (shippingAddress) {
            if (!shippingAddress.isDefault
              || !Utils.validateAddress(shippingAddress)) {
              return;
            }

            $scope.shippingAddress = shippingAddress;
            loadShippingMethods();
          });
            setGrandTotal();
            //console.log('account.coupon');console.log(account);
          account.coupon.forEach(function (coupon) {
            if (!coupon.approved || coupon.order) return;
            coupon.selected = false;
            $scope.coupons.push(coupon);
            couponDisabled();
          });
        });

      var shippingCost=0;
      $scope.shippingMethodClick = function(){
        shippingCost = this.shippingMethod.selected.cost;
        setGrandTotal();
      };

      var couponAmount=0;
      $scope.couponClick = function(coupon){
        if (coupon.selected == true){
          if (coupon.amount>$scope.grandTotal)
          {
            coupon.selected = false;
            console.log(coupon);
          }
          else
          {
            couponAmount += coupon.amount;
          }
        }
        else
        {
          couponAmount -= coupon.amount;
        }
        setGrandTotal();
        couponDisabled();
      };

      //eric 修改 at 2015年08月06日13:55:22 用于控制代金券可用状态
      var setGrandTotal = function(){
        var grandTotal = quoteTotal + shippingCost - couponAmount;
        $scope.grandTotal = grandTotal;
      };

      var couponDisabled = function(){
        $scope.coupons.forEach(function(coupon){
          if (coupon.selected==false){
            coupon.disabled = (coupon.amount>=$scope.grandTotal);
          }
        });
      };

      $scope.samples = [];
      $http.get('/api/search/sample')
        .success(function (res) {
          if (res.error) return;

          res = res.filter(function (item) {
            // Only display simple products
            return item['type_id'] === 'simple';
          });
          $scope.samples = res;
        });

      var quoteTotal = 0;
      $scope.quotes = [];
      Quote.query(function (quotes) {
        $scope.quotes = quotes;
        quotes.forEach(function (quote) {
          quoteTotal += Quote.calcPrice(quote);
          setGrandTotal();
        });
      }, function () {
        $window.alert('Can not connect to server. Please try again later.');
      });


      $scope.getOptionPrice = function (quote) {
        return Quote.getOptionPrice(quote);
      };

      $scope.calcPrice = function (quote) {
        return Quote.calcPrice(quote);
      };

      var $loadingEl = angular.element('#loading');
      $scope.placeOrder = function () {
        if (!$scope.quotes.length || !$scope.billingAddress || !$scope.shippingAddress
          || !$scope.shippingMethod.selected || !$scope.paymentMethod) {
          $window.alert('Error! Order data is incomplete.');
          return;
        }
      //  console.info('paymentMethod999:',$scope.paymentMethod);
        var order = {
          items: $scope.quotes,
          samples: [],
          shippingAddress: $scope.shippingAddress,
          billingAddress: $scope.billingAddress,
          shippingMethod: $scope.shippingMethod.selected,
          paymentMethod: $scope.paymentMethod ,
          coupons: [],
          subtotal: quoteTotal
        };

        $scope.samples.forEach(function (sample) {
          if (!sample.selected) return;
          order.samples.push(Quote.toQuoteItem(sample));
        });

        var saving = 0;
        $scope.coupons.forEach(function (coupon) {
          if (!coupon.selected) return;
          order.coupons.push(coupon);
          saving += coupon.amount;
        });

        console.log(saving);
        order.grandTotal = quoteTotal + order.shippingMethod.cost - saving;
        console.log(order.grandTotal);
        $scope.submitting = true;
        $loadingEl.modal('show');
        $http.post('/api/order', order)
          .success(function (res) {
            if (res.error) {
              console.log(res);
              $window.alert('Error! Place order failed. Please try again later.');
              return;
            }
            //console.info('已经跳转到新页面');
            $loadingEl.on('hidden.bs.modal', function (e) {
                $window.location.href = res.redirectUrl;
            });
          })
          .error(function () {
            $window.alert('Can not connect to server. Please try again later.');
          })
          .finally(function () {
            $scope.submitting = false;
            $loadingEl.modal('hide');
           // console.info('已经隐藏Modal');
          });
      };

      $scope.$watch('paymentMethod',function(newValue,OldValue){
       // console.info('newValue:',newValue);
       // console.info('$scope.paymentMethod:',$scope.paymentMethod);

       // console.info('OldValue:',OldValue);

        if( 'checkmo' == newValue.toString() ){
         // console.info('check_money=====');
          angular.element('#tip').text('you selected  Check / Money Order Payment Method .');
        }else{
          angular.element('#tip').text('You will be redirected to the PayPal website when you place an order.');
        }


      });
     // $scope.$digest();
    }
  ])

  .controller('OrderCheckMoneyCtrl',['$scope','$location','$routeParams','Order',function($scope,$location,$routeParams,Order){
    $scope.viewOrder = function(){
     // console.info('$routeParams.id:',$routeParams.id);
      $location.path('/order/'+$routeParams.id);
    };

    Order.get({id: $routeParams.id}, function (res) {
      if (res.error) {
        switch (res.error) {
          case 403:
            $window.alert('Illegal request.');
            break;
          case 404:
            $window.alert('Order does not exist.');
            break;
          case 500:
            $window.alert('Internal server error. Please try again later.');
            break;
          default:
            $window.alert('Unknown error. Please try again later.');
        }
        return;
      }
      console.info('res:',res);
      $scope.orderId = res.incrementId;
      /*$scope.order = res;
      var order = $scope.order;
      console.info('order:',order);
      if(!order.processing){
        var createdAt = order.createdAt;
        console.info('createdAt.valueOf():',new Date(createdAt).getTime());
        console.info('Date.now():',Date.now());
        console.info('(new Date(createdAt).getTime() + 30*60*1000 < (new Date().getTime()):',((new Date(createdAt).getTime() + 30*60*1000 < Date.now())));
        $scope.isDisableFulfillPayment = (new Date(createdAt).getTime() + 30*60*1000 < Date.now());
      }
*/
    }, function () {
      $window.alert('Error! Can not connect to server. Please try again later.');
    });

  }])

  .controller('CreateOrderSuccessCtrl', ['$scope', '$location', '$http', '$window',
    function ($scope, $location, $http, $window) {
      $http.post('/api/order/success', $location.search())
        .success(function (res) {
		  console.log(res);
          if (res.error) {
            switch (res.error) {
              case 400:
                $window.alert('Illegal request.');
                break;
              case 404:
                $window.alert('Order does not exist.');
                break;
              default:
                $window.alert('Unknown error. Please try again later.');
            }
            return;
          }

          $scope.incrementId = res.incrementId;
        })
        .error(function () {
          $window.alert('Can not connect to server. Please try again later.');
        });
    }
  ])

  .controller('CreateRmaItemCtrl', ['$scope', '$location', '$window', 'User', 'RmaItem',
    function ($scope, $location, $window, User, RmaItem) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      $scope.backToList = function () {
        $location.path('/rma-item');
      };

      $scope.submitting = false;

      $scope.reset = function () {
        $scope.item = null;
      };

      $scope.submit = function () {
        var qty = $scope.item ? $scope.item.qty : 0;
        if (!angular.isNumber(qty)) {
          qty = parseInt(qty);
        }

        if (!$scope.item || !$scope.item.sku || !qty || !$scope.item.why) {
          $window.alert('Error! All fields are required. Please input valid data');
          return;
        }

        $scope.submitting = true;
        var rmaItem = new RmaItem({
          sku: $scope.item.sku,
          qty: qty,
          why: $scope.item.why
        });

        rmaItem.$save()
          .then(function (res) {
            if (res.error) {
              $window.alert('Error! Internal server error. Please try again later.');
              return;
            }

            $window.alert('Bravo! You have created a new RMA item. You can continue to add more.');
            $scope.item = null;
            $location.path('/rma-item');
          })
          .catch(function () {
            $window.alert('Error! Can not connect to server. Please try again later.');
          })
          .finally(function () {
            $scope.submitting = false;
          });
      };
    }
  ])

  .controller('CreateRmaParcelCtrl', ['$scope', '$location',
    '$window', 'User', 'RmaItem', 'RmaParcel',
    function ($scope, $location, $window, User, RmaItem, RmaParcel) {
      if (!User.isLoggedIn()) {
        $window.alert('Error! Members only area. Please login first.');
        $location.path('/');
        return;
      }

      $scope.backToList = function () {
        $location.path('/rma-parcel');
      };

      $scope.submitting = false;

      $scope.reset = function () {
        angular.forEach($scope.rmaItems, function (item) {
          item.selected = false;
        });
      };

      $scope.submit = function () {
        var ids = [];
        angular.forEach($scope.rmaItems, function (item) {
          item.selected && ids.push(item._id);
        });

        if (ids.length === 0) {
          $window.alert('Error! Please select one RMA item at least!');
          return;
        }

        $scope.submitting = true;
        var rmaParcel = new RmaParcel({rmaItem: ids});
        rmaParcel.$save()
          .then(function (res) {
            if (res.error) {
              switch (res.error) {
                case 400:
                  $window.alert('Illegal request.');
                  break;
                case 500:
                  $window.alert('Internal server error. Please try again later.');
                  break;
                default:
                  $window.alert('Unknown error. Please try again later.');
              }
              return;
            }

            $window.alert('Bravo! You have created a new RMA parcel (RMA number: '
              + res.rmaNumber + ').');
            $location.path('/rma-parcel');
          })
          .catch(function () {
            $window.alert('Error! Can not connect to server. Please try again later.');
          })
          .finally(function () {
            $scope.submitting = false;
          });
      };

      RmaItem.query({state: 'approved'}, function (items) {
        $scope.rmaItems = items;
      }, function () {
        $window.alert('Error! Can not connect to server. Please try again later.');
      });
    }
  ]);
