'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('clockIcon', clockIcon);

    clockIcon.$inject = ['MaterialIconsFactory'];

    function clockIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('clock');
    }

})();
