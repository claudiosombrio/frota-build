'use strict';

(function () {
    angular.module('app.database')
        .factory('$squel', $squel);

    $squel.$inject = ['$window'];

    function $squel($window) {
        return $window.squel;
    }

})();
