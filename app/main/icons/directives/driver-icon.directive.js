'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('driverIcon', driverIcon);

    driverIcon.$inject = ['MaterialIconsFactory'];

    function driverIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('driver');
    }

})();
