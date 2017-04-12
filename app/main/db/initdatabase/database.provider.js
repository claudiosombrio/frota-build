'use strict';

(function () {
    angular.module('app.database')
        .provider('Database', Database);

    Database.$inject = [];

    function Database() {
        var self = this;
        var instance = {};

        self.setNameDatabase = setNameDatabase;

        function setNameDatabase(value){
          instance.nameDatabase = value;
        }

        self.$get = function(){
          return instance;
        };

        return self;
    }

})();
