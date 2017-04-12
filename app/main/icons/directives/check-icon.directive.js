'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('checkIcon', checkIcon);

    checkIcon.$inject = ['MaterialIconsFactory'];

    function checkIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('done');
    }

})();
