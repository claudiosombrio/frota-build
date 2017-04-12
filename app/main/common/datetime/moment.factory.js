'use strict';

(function () {
    angular.module('app.common')
        .factory('$moment', momentWrapper);

    momentWrapper.$inject = ['$window'];

    function momentWrapper($window) {
      var self = $window.moment;

      self.fn.toString = toString;

      function toString () {
        return this.format('YYYY-MM-DD HH:mm:ss');
      }

      return self;
    }

})();
