'use strict';

(function () {
    angular.module('main')
        .factory('InitConfigService', InitConfigService);

    InitConfigService.$inject = [];

    function InitConfigService() {
        var self = this;
        var initConfig = {};

        self.setConfigInitApp = setConfigInitApp;
        self.getInitConfig = getInitConfig;

        function setConfigInitApp(config){
          initConfig = config;
        }

        function getInitConfig(){
          return angular.copy(initConfig);
        }

        return self;
    }

})();
