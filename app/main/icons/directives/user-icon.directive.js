'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('userIcon', userIcon);

    userIcon.$inject = ['MaterialIconsFactory'];

    function userIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('user');
    }

})();
