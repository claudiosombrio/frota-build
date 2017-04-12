'use strict';

(function () {
    angular.module('app.common')
        .factory('popup', Popup);

  Popup.$inject = ['$ionicPopup', '$localStorage', '$injector', '$state', '$moment'];

    function Popup($ionicPopup, $localStorage, $injector, $state, $moment) {
      var LoginValidator = $injector.get('LoginValidator');

      var self = this;

        self.info = info;
        self.password = password;
        self.error = error;
        self.confirmation = confirmation;

        function info(message){
          var config = {};

          config.title = 'Informação';
          config.template = message;

          return $ionicPopup.alert(config);
        }

        function error(message){
          var config = {};

          config.title = 'Erro';
          config.template = message;
          config.okType = 'button-assertive';

          return $ionicPopup.alert(config);
        }

        function password(scope, usuarioToStorage, stateToGo){
          var instance = {};

          var eventUserOK = function(){
            instance.close();

            if(angular.isFunction(stateToGo)){
              stateToGo();
            }else if(angular.isString(stateToGo)){
              $state.go(stateToGo);
            }
          };

          instance = $ionicPopup.show(buildPopup(scope, usuarioToStorage, eventUserOK));

          return instance;
        }

        function confirmation(mensagem){
          return $ionicPopup.confirm({
            title: 'Atenção!',
            template: mensagem,
            buttons: [
              { text: 'Não' ,
                onTap: function() {
                  return false;
                }
              },
              {
                text: '<b>Sim</b>',
                type: 'button-positive',
                onTap: function() {
                  return true;
                }
              }
            ]
          });
        }

        function buildPopup(scope, usuarioToStorage, eventUserOK){
          var popup = {};

          scope.usuario = angular.copy(usuarioToStorage) || {};

          scope.usuario.senha = null;

          scope.passwordError = false;
          scope.passwordInvalid = false;

          popup.templateUrl = 'main/common/popups/password.template.html';
          popup.title = 'Informe sua Senha';

          popup.scope = scope;
          popup.buttons = [];

          popup.buttons.push({
            text: 'Cancelar',
            onTap: function(){
              return null;
            }
          });
          popup.buttons.push({
            text: '<b>OK</b>',
            type: 'button-positive',
            onTap: function(e){
              e.preventDefault();

              return LoginValidator.validate(scope.usuario).then(
                function(value){
                  if(!value.valid){
                    scope.passwordError = _.isNull(value.valid);
                    scope.passwordInvalid = value.valid === false;
                  }else{
                    $localStorage.setUsuario(usuarioToStorage);
                    $localStorage.setHorario($moment());

                    eventUserOK(true);
                  }

                  return value.valid;
                }
              );
            }
          });

          return popup;
        }

        return self;
    }

})();
