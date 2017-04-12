'use strict';

(function () {
    angular.module('app.common')
        .filter('momentToTime', momentToTime);

    momentToTime.$inject = ['$moment'];

    function momentToTime($moment) {
        function self(momentValue) {
          if(!momentValue){
            return '';
          }

          return $moment(momentValue)
            .format('HH:mm');
        }

        return self;
    }
})();
