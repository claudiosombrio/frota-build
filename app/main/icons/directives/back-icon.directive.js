'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('backIcon', backIcon);

    backIcon.$inject = ['MaterialIconsFactory'];

    function backIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('back');
    }

})();
