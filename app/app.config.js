'use strict';

(function () {
    angular.module('diarioDeBordo')
        .config(appConfig);

    function appConfig($ionicConfigProvider) {
      $ionicConfigProvider.views.forwardCache(false);
      $ionicConfigProvider.views.maxCache(0);
      $ionicConfigProvider.scrolling.jsScrolling(false);
    }
})();
