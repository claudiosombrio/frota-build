'use strict';

(function () {
    angular.module('app.common')
        .config(ionicConfigFunction);

    function ionicConfigFunction($ionicConfigProvider) {
      $ionicConfigProvider.scrolling.jsScrolling(false);
    }
})();
