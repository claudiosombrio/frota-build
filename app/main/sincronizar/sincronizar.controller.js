'use strict';

(function () {
  angular.module('app.sincronizacao')
  .controller('SincronizarCtrl', SincronizarCtrl);

  SincronizarCtrl.$inject = ['$injector', '$log', '$state', '$jsSHA', 'promiseTracker', '$localStorage'];

  function SincronizarCtrl($injector, $log, $state, $jsSHA, promiseTracker, $localStorage) {
    var vm = this;
    var IntegracaoService = $injector.get('IntegracaoService');
    var popup = $injector.get('popup');
    var passwordValid = true;

    if(window.localStorage.url){
      var url = window.localStorage.url;
      vm.url = url;
    }else{
      $state.goNoHistory('app.configuracao');
    }

    vm.sincronizar = sincronizar;
    vm.usuario = {};

    if (window.localStorage.usuario &&  window.localStorage.senha) {
      vm.usuario.login =  window.localStorage.usuario;
      vm.usuario.senha =  window.localStorage.senha;
    }else{
        $state.goNoHistory('app.configuracao');
    }

    vm.tracker = {};
    vm.tracker.connecting = promiseTracker();

    vm.passwordIsValid = function () {
      return passwordValid;
    };

    function sincronizar() {
      vm.form.$setSubmitted(true);
      if (vm.form.$valid) {
        if (vm.url) {
          IntegracaoService.setBaseUrl(vm.url);

          var user = angular.copy(vm.usuario);
          user.senha = $jsSHA.criptografar(vm.usuario.senha);

          vm.tracker.connecting.addPromise(
            IntegracaoService.validateUser(user).then(function (result) {
              if (result && result.codigo) {
                if (result.codeDetail) {
                  popup.error(result.codeDetai);
                }
                $localStorage.setUsuarioSync($localStorage.getUsuario());
                $localStorage.setUsuario(result);
                $log.log('Iniciando sincronização.');
                $state.goNoHistory('app.sincronizando');
              } else {
                popup.error('Usuário ou senha inválido ou profissional não vinculado ao usuário, acesse as configurações para alterar.');
              }
            }, function (result) {
              if (result.status <= 0) {
                popup.error('A URL requisitada (' + vm.url + ') não existe ou é inválida, verifique o campo informado ou a conexão com a internet.');
              }else if(result.status === 406){

                popup.error('(' + result.headers['codeError'] + ') ' + result.headers['codeMessage'])
              }
            })
          );
        }
      }
    }
  }

})();
