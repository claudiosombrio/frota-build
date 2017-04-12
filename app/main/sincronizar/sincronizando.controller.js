'use strict';

(function() {
  angular.module('app.sincronizacao')
    .controller('SincronizandoCtrl', SincronizandoCtrl);

  SincronizandoCtrl.$inject = ['$scope', '$state', '$injector', '$log', '$localStorage', '$moment', '$rootScope', '$ionicScrollDelegate'];

  function SincronizandoCtrl($scope, $state, $injector, $log, $localStorage, $moment, $rootScope, $ionicScrollDelegate) {
    var vm = this;
    var CreateDatabase = $injector.get('CreateDatabase');
    var IntegracaoService = $injector.get('IntegracaoService');
    var InitConfigService = $injector.get('InitConfigService');

    vm.logSincronizacao = [];

    vm.goHome = goHome;

    function myLogger(message, type) {
      return {
        mensagem: message,
        success: !!type && !!type.success,
        error: !!type && !!type.error
      };
    }

    init();

    function init() {
      vm.successful = false;
    }

    function error(message) {
      $localStorage.setUsuario($localStorage.getUsuarioSync());
      return function(erro) {
        if (message) {
          if (erro.headers) {
            vm.logSincronizacao.push(myLogger(message + ': ' + erro.headers('codeDetail'), {
              error: true
            }));
          } else {
            vm.logSincronizacao.push(myLogger(message + ': ' + erro, {
              error: true
            }));
          }
          $ionicScrollDelegate.scrollBottom();
        }
        $log.error(erro);
        vm.successful = false;
      };
    }

    $scope.$on('ADD::LOG::SINCRONIZACAO', function(event, message) {
      vm.logSincronizacao.push(message);
    });

    CreateDatabase.init().then(function() {
      $log.log('Base de dados atualizada com sucesso.');


      IntegracaoService.enviarViagens().then(function() {

        vm.logSincronizacao.push(myLogger('Viagens enviadas com sucesso'));
        $log.log('Viagens enviadas com sucesso');
        $ionicScrollDelegate.scrollBottom();
        IntegracaoService.enviarPassageiros().then(function() {
            vm.logSincronizacao.push(myLogger('Passageiros enviados com sucesso'));
          IntegracaoService.enviarPontosViagens().then(function() {
            vm.logSincronizacao.push(myLogger('Rotas enviadas com sucesso'));
            $log.log('Rotas enviadas com sucesso');
            $ionicScrollDelegate.scrollBottom();

            IntegracaoService.buscarDadosCadastrais().then(function() {

              $log.log('Dados cadastrais carregados em memoria');
              $ionicScrollDelegate.scrollBottom();
              IntegracaoService.limparDadosCadastrais().then(function() {

                vm.logSincronizacao.push(myLogger('Dados cadastrais removidos com sucesso'));
                $log.log('Dados cadastrais removidos com sucesso');
                $ionicScrollDelegate.scrollBottom();
                IntegracaoService.importarDadosCadastrais().then(function() {

                  vm.logSincronizacao.push(myLogger('Dados cadastrais importados com sucesso'));
                  $log.log('Dados cadastrais importados com sucesso.');
                  $ionicScrollDelegate.scrollBottom();
                  IntegracaoService.limparRotas().then(function() {
                    IntegracaoService.limparViagens().then(function() {
                      vm.logSincronizacao.push(myLogger('Sincronização realizada com sucesso', {
                        success: true
                      }));

                      $localStorage.setHorario($moment());
                      $localStorage.setDatabaseCreated({
                        created: true
                      });

                      $localStorage.setUsuario($localStorage.getUsuarioSync());

                      InitConfigService.setConfigInitApp({
                        sincronized: true
                      });
                      $ionicScrollDelegate.scrollBottom();
                      vm.successful = true;
                    }, error('Erro ao limpar as viagens.'));
                  }, error());
                }, error('Erro ao importar os dados cadastrais'));
              }, error('Erro ao remover os dados cadastrais'));
            }, error());
          }, error(' Erro ao enviar as rotas das viagens'));
        }, error(' Erro ao enviar os passageiros das viagens'));
      }, error('Erro ao enviar as viagens'));
    }, error('Error ao atualizar a estrutura da base de dados'));

    function goHome() {
      // $localStorage.setUsuario($localStorage.getUsuarioSync())
      if (vm.successful) {
        $rootScope.$broadcast('DB:OK', true);
      }
      $state.goNoHistory('app.inicio');
    }
  }

})();
