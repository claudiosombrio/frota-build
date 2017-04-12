'use strict';

(function () {
  angular.module('main')
    .controller('main.InicioCtrl', InicioCtrl);

  InicioCtrl.$inject = ['$state', '$scope', '$injector', '$moment', '$timeout', '$http', '$ionicLoading' , '$cordovaFile', '$cordovaFileOpener2'];

  function InicioCtrl($state, $scope, $injector, $moment, $timeout, $http, $ionicLoading, $cordovaFile, $cordovaFileOpener2) {
    var vm = this;
    var LOGIN_STATE = 'app.usuario';
    var InitConfigService = $injector.get('InitConfigService');
    var popup = $injector.get('popup');
    var LoginEventEmitter = $injector.get('LoginEventEmitter');
    var $localStorage = $injector.get('$localStorage');
    var RoteiroService = $injector.get('RoteiroService');
    RoteiroService.setNextState('app.novaviagem');
    RoteiroService.setLabel('Nova Viagem!');

    //Apenas enquanto não for liberado para o cliente
    var LIBERAR_PROCEDIMENTO_ATUALIZACAO = false;

    var DELAY = 1000;

    var databaseCreated = $localStorage.getDatabaseCreated() && $localStorage.getDatabaseCreated().created;

    if(LIBERAR_PROCEDIMENTO_ATUALIZACAO){
      verificarAtualizacao();
    }

    $scope.$on('DB:OK', function(event, ok){
      if(ok){
        init();
      }
    });

    vm.estadosViagem = $localStorage.getEstadoViagem();

    if(!vm.estadosViagem){
      vm.estadosViagem = {
        viajando: false,
        encerrando: false,
        novaViagem: true
      };
    }

    vm.user = $localStorage.getUsuario();
    vm.veiculo = $localStorage.getVeiculo();

    if(!databaseCreated){
      $state.goNoHistory('app.configuracao');
      return;
    }

    if(!$localStorage.getUsuario() || !$localStorage.getVeiculo()){
      $state.goNoHistory(LOGIN_STATE);
    }

    if(InitConfigService.getInitConfig() && InitConfigService.getInitConfig().sincronized){
      if(!databaseCreated){
        $state.goNoHistory('app.configuracao');
        return;
      }

      init();
    }

    function init(){
      LoginEventEmitter.onBeginApp().then(function(valid){
        if(!databaseCreated){
          $state.goNoHistory('app.configuracao');
          return;
        }

        if (!valid) {
          $state.goNoHistory(LOGIN_STATE);
        }
      });
    }

    function refreshClock(){
      vm.time = $moment();
      $timeout(refreshClock, DELAY);
    }

    $timeout(refreshClock, DELAY);


    function verificarAtualizacao(){
      $http.get('versao.txt').success(function (versaoLocal) {
        var url = 'https://s3-sa-east-1.amazonaws.com/celk/storage/aplicativos/versao.txt?'+ new Date().getTime();
        console.log('URL REMOTA: ' + url);

        $http.get(url).success(function (versaoRemota) {
          console.log('VERSAO REMOTA: ' + versaoRemota);
          if (!_.isNaN(versaoRemota) && !_.isNaN(versaoLocal) && Number(versaoRemota) > Number(versaoLocal)) {
            popup.confirmation('Existe uma nova versão disponível que pode corrigir problemas no aplicativo. Deseja atualizar agora?').then(function (res) {
              if (res) {
                $scope.bind.loading = 'Carregando...';

                $ionicLoading.show({
                  template: '{{bind.loading}}',
                  scope: $scope
                });

                $cordovaFile.downloadFile('https://s3-sa-east-1.amazonaws.com/celk/storage/aplicativos/mobilefrota.apk',
                  'cdvfile://localhost/persistent/celk/mobilefrota/mobilefrota.apk').then(function () {

                  $cordovaFileOpener2.open(
                    'cdvfile://localhost/persistent/celk/mobilefrota/mobilefrota.apk',
                    'application/vnd.android.package-archive'
                  );

                  $ionicLoading.hide();

                }, function () {
                  $ionicLoading.hide();
                  popup.info('Não foi possível atualizar, verifique se você está conectado na internet e tente novamente.');
                }, function (progress) {
                  if (progress.lengthComputable) {
                    var perc = Math.floor(progress.loaded / progress.total * 100);
                    $scope.bind.loading = 'Carregando... ' + perc + '%';
                  } else {
                    $scope.bind.loading = 'Carregando... ';
                  }
                });
              }
            });
          }
        });
      });
    }

  }

})();
