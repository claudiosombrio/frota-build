'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('newTravelIcon', newTravelIcon);

    newTravelIcon.$inject = ['MaterialIconsFactory'];

    function newTravelIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('newtravel');
    }

})();
