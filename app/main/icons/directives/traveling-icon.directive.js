'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('travelingIcon', travelingIcon);

    travelingIcon.$inject = ['MaterialIconsFactory'];

    function travelingIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('traveling');
    }

})();
