'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('saveIcon', saveIcon);

    saveIcon.$inject = ['MaterialIconsFactory'];

    function saveIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('save');
    }

})();
