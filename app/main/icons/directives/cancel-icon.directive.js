'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('cancelIcon', cancelIcon);

    cancelIcon.$inject = ['MaterialIconsFactory'];

    function cancelIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('cancel');
    }

})();
