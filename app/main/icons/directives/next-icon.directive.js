'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('nextIcon', nextIcon);

    nextIcon.$inject = ['MaterialIconsFactory'];

    function nextIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('next');
    }

})();
