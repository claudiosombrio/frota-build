'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('travelsIcon', travelsIcon);

    travelsIcon.$inject = ['MaterialIconsFactory'];

    function travelsIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('travels');
    }

})();
