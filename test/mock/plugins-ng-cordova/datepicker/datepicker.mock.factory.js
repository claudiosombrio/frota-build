'use strict';

(function () {
    angular.module('app.mocks')
        .factory('$cordovaDatePicker', $cordovaDatePicker);

    $cordovaDatePicker.$inject = ['$q'];

    function $cordovaDatePicker($q) {
        var self = {};

        self.show = show;

        function show(options){
          var q = $q.defer();
          options = options || {date: new Date(), mode: 'date'};
          q.resolve(options.date);
          return q.promise;
        }

        return self;
    }

})();
