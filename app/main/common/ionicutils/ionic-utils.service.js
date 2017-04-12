'use strict';

(function () {
    angular.module('app.common')
        .factory('$ionicUtils', $ionicUtils);

    $ionicUtils.$inject = ['$ionicScrollDelegate'];

    function $ionicUtils($ionicScrollDelegate) {
        var self = this;

        self.toTop = toTop;

        function toTop(handleName){
          if(handleName){
            $ionicScrollDelegate.$getByHandle(handleName).resize().then(function() {
              $ionicScrollDelegate.$getByHandle(handleName).getScrollView().scrollTo(0, 0, false);
            });
          }else{
            $ionicScrollDelegate.resize().then(function() {
              $ionicScrollDelegate.getScrollView().scrollTo(0, 0, false);
            });
          }
        }

        return self;
    }

})();
