'use strict';

(function () {
    angular.module('app.common')
        .factory('$jsSHA', $jsSHA);

    $jsSHA.$inject = [];

    function $jsSHA() {
        var self = this;

        self.criptografar = criptografar;

        function criptografar(value){
          var myJsSHA = new jsSHA(value, 'TEXT');

          return myJsSHA.getHash('SHA-256', 'HEX').toUpperCase();
        }

        return self;
    }

})();
