'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('plusIcon', plusIcon);

    plusIcon.$inject = ['MaterialIconsFactory'];

    function plusIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('plus');
    }

})();
