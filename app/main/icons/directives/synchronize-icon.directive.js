'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('synchronizeIcon', synchronizeIcon);

    synchronizeIcon.$inject = ['MaterialIconsFactory'];

    function synchronizeIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('synchronize');
    }

})();
