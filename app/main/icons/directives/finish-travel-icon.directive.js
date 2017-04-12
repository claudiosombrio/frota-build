'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('finishTravelIcon', finishTravelIcon);

    finishTravelIcon.$inject = ['MaterialIconsFactory'];

    function finishTravelIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('finishTravel');
    }

})();
