'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('configIcon', configIcon);

    configIcon.$inject = ['MaterialIconsFactory'];

    function configIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('config');
    }

})();
