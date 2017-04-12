'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('editlocationIcon', editlocationIcon);

    editlocationIcon.$inject = ['MaterialIconsFactory'];

    function editlocationIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('edit_location');
    }

})();
