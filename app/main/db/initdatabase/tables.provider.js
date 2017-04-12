'use strict';

(function () {
    angular.module('app.database')
        .provider('Tables', Tables);

    Tables.$inject = [];

    function Tables() {
        var self = this;
        var structure = {};

        self.setStructure = setStructure;

        function setStructure(value){
          structure = value;
        }

        self.$get = function(){
          return structure;
        };

        return self;
    }

})();
