'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('deleteItemIcon', deleteItemIcon);

    deleteItemIcon.$inject = ['MaterialIconsFactory'];

    function deleteItemIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('delete');
    }

})();
