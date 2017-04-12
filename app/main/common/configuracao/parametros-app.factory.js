'use strict';

(function () {
  angular.module('app.common')
    .factory('ParametrosApp', ParametrosApp);

  ParametrosApp.$inject = ['$localStorage'];

  function ParametrosApp($localStorage) {
    var self = this;

    var timeSession = new TimeSession($localStorage);
    self.getTimeSession = getTimeSession;

    function getTimeSession(){
      return timeSession;
    }

    return self;
  }

  function TimeSession($localStorage){
    var self = this;

    var MINUTES_SESSION_DEFAULT = 15;
    var TIME_SESSION_DEFAULT = MINUTES_SESSION_DEFAULT * 60 * 1000;

    self.setMiliseconds = setMiliseconds;
    self.getMiliseconds = getMiliseconds;
    self.setMinutes = setMinutes;
    self.getMinutes = getMinutes;

    function toStorage(sessionMS){
      $localStorage.setSessao(sessionMS);
    }

    function fromStorage(){
      return $localStorage.getSessao();
    }

    function setMiliseconds(ms){
      toStorage(ms);
    }

    function getMiliseconds(){
      return fromStorage() || TIME_SESSION_DEFAULT;
    }

    function setMinutes(minute){
      toStorage(minute * 60 * 1000);
    }

    function getMinutes(){
      var timeSession = fromStorage();

      return !timeSession ? MINUTES_SESSION_DEFAULT : Math.round(timeSession/60/1000);
    }
  }

})();
