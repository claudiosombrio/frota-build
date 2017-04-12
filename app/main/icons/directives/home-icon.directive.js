'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('homeIcon', homeIcon);

    homeIcon.$inject = ['MaterialIconsFactory'];

    function homeIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('calendar');
    }

})();

