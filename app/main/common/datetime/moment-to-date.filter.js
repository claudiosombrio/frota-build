'use strict';

(function () {
    angular.module('app.common')
        .filter('momentToDate', momentToDate)
        .filter('momentToHour', momentToHour);

    momentToDate.$inject = ['$moment']

    function momentToDate($moment) {
      function self(value){
        if(!value){
          return '';
        }

        return $moment(value)
          .format('DD/MM/YYYY');
      }

      return self;

    }
    momentToHour.$inject = ['$moment']
    function momentToHour($moment) {
      function self(value){
        if(!value){
          return '';
        }

        return $moment(value)
          .format('HH:mm:SS');
      }

      return self;

    }
})();
