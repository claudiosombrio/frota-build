'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('calendarIcon', calendarIcon);

    calendarIcon.$inject = ['MaterialIconsFactory'];

    function calendarIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('calendar');
    }

})();
