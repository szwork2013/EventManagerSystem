angular.module('DistApp')

  .directive('mkFile', [ '$window', function ($window) {
    return {
      restrict: 'A',
      scope: {
        mkFileData: '='
      },
      link: function (scope, el, attr) {
        var type = attr.mkFileType;
        var size = parseFloat(attr.mkFileSize); // megabyte

        el.on('change', function (event) {
          var file = event.target.files[0];

          if (type && file.type.indexOf(type) === -1) {
            $window.alert('Error! File type must be ' + type);
            return;
          }
          if (size && file.size > size*1024*1024) {
            $window.alert('Error! File size must not be bigger than ' + size + 'M');
            return;
          }

          var reader = new FileReader();
          reader.onload = function (event) {
            scope.mkFileData = event.target.result;
            scope.$apply();
          };
          reader.readAsDataURL(file);
        });
      }
    };
  } ]);