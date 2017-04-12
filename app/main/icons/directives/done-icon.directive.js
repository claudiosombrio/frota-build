'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('doneIcon', doneIcon);

    doneIcon.$inject = ['MaterialIconsFactory'];

    function doneIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('done');
    }

})();
