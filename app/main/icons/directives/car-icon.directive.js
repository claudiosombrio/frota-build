'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('carIcon', carIcon);

    carIcon.$inject = ['MaterialIconsFactory'];

    function carIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('car');
    }

})();
