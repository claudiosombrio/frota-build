'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('peopleIcon', peopleIcon);

    peopleIcon.$inject = ['MaterialIconsFactory'];

    function peopleIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('people');
    }

})();
