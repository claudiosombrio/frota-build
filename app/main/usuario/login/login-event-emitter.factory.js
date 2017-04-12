'use strict';

(function () {
    angular.module('app.usuario')
        .factory('LoginEventEmitter', LoginEventEmitter);

    LoginEventEmitter.$inject = ['$localStorage', '$injector', '$q', 'popup', 'EventEmitter', '$moment'];

    function LoginEventEmitter($localStorage, $injector, $q, popup, EventEmitter, $moment) {
        var ParametrosApp = $injector.get('ParametrosApp');
        var $rootScope = $injector.get('$rootScope');

        var eventEmitter = new EventEmitter();

        eventEmitter.eventSave(validateSession);
        eventEmitter.eventStateGo(validateSession);
        eventEmitter.event('onBeginApp', validateSessionOnBegin);


        function isValidSession(){
          var horarioStorage = $localStorage.getHorario();

          return horarioStorage.add(ParametrosApp.getTimeSession().getMinutes(), 'minutes').isAfter($moment()) &&
                 horarioStorage.format('YYYYMMDD') === $moment().format('YYYYMMDD');
        }

        function validateSession(afterEvent, isBegin){
          return $q.when(isValidSession())
             .then(function(valid){
              if(!valid && !isBegin){
                var scope = $rootScope.$new(true);

                return popup.password(scope, $localStorage.getUsuario(), afterEvent);
              }

              return valid;
          });
        }

        function validateSessionOnBegin(afterEvent){
          return validateSession(afterEvent, true);
        }

        return eventEmitter;
    }
})();
