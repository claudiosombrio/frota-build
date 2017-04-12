'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('playIcon', playIcon);

    playIcon.$inject = ['MaterialIconsFactory'];

    function playIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('play');
    }

})();
