'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('exitIcon', exitIcon);

    exitIcon.$inject = ['MaterialIconsFactory'];

    function exitIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('exit');
    }

})();
