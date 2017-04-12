'use strict';

(function() {
  angular.module('diarioDeBordo')
    .run(appRun);

  appRun.$inject = ['$ionicPlatform', 'DBClient', '$cordovaGeolocation', '$log'];

  function appRun($ionicPlatform, DBClient, $cordovaGeolocation, $log) {
    $ionicPlatform.ready(function() {

      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }

      DBClient.getSession();

      var options = {
        timeout: 120000,
        enableHighAccuracy: true
      };

      $cordovaGeolocation
        .getCurrentPosition(options)
        .then(function(position) {
          var lat = position.coords.latitude;
          var long = position.coords.longitude;

          $log.log(position);
          $log.log('lat: ' + lat);
          $log.log('long: ' + long);
        }, $log.error);
    });


  }
})();
