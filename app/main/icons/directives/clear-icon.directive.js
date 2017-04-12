'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('clearIcon', clearIcon);

    clearIcon.$inject = ['MaterialIconsFactory'];

    function clearIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('CLEAR');
    }

})();
