'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('editItemIcon', editItemIcon);

    editItemIcon.$inject = ['MaterialIconsFactory'];

    function editItemIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('edit');
    }

})();
