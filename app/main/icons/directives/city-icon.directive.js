'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('cityIcon', cityIcon);

    cityIcon.$inject = ['MaterialIconsFactory'];

    function cityIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('location_city');
    }

})();
