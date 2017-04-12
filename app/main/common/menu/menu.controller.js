'use strict';

(function() {
  angular.module('app.common')
    .controller('common.MenuCtrl', MenuCtrl);

  MenuCtrl.$inject = ['$log', '$state', 'LoginEventEmitter', '$rootScope', '$injector', '$localStorage'];

  function MenuCtrl($log, $state, LoginEventEmitter, $rootScope, $injector, $localStorage) {
    $log.log('common.MenuCtrl ativo!');

    var vm = this;
    var backgroundGeoLocation = !window.plugins ? undefined : window.plugins.backgroundGeoLocation;
    var MotoristaService = $injector.get('MotoristaService');

    vm.go = go;

    vm.estadosViagem = $localStorage.getEstadoViagem();

    if (!vm.estadosViagem) {
      vm.estadosViagem = {
        viajando: false,
        encerrando: false,
        novaViagem: true
      };

      $localStorage.setEstadoViagem(vm.estadosViagem);
    }

    vm.goSelectMotorista = goSelectMotorista;


    $rootScope.$on('ESTADO::VIAGEM', function(event, estado) {

      var estadoToStorage = {};

      estadoToStorage.viajando = !!estado.viajando;
      estadoToStorage.encerrando = !!estado.encerrando;
      estadoToStorage.novaViagem = !!estado.novaViagem;

      vm.estadosViagem = estadoToStorage;

      $localStorage.setEstadoViagem(estadoToStorage);
    });

    function go(to, eventBeforeStateGo) {
      var eventAfterValidatePassword = function() {
        $state.goNoHistory(to)
      };

      LoginEventEmitter.onStateGo(eventAfterValidatePassword).then(function(valid) {
        if (valid) {
          if (angular.isFunction(eventBeforeStateGo)) {
            eventBeforeStateGo();
          }

          eventAfterValidatePassword();
        }
      });
    }

    function goSelectMotorista() {
      MotoristaService.setNextState('app.veiculo');
      MotoristaService.setOnlySelectionDriver(false);

      $state.go('app.usuario');
    }

    $rootScope.$on('CAPTAR::PONTOS', function() {
      startGetLocation();
    });

    $rootScope.$on('PARAR::CAPTAR::PONTOS', function() {
      backgroundGeoLocation.stop();
    });

    if ($localStorage.getPontosGps() && $localStorage.getPontosGps().isRunning) {
      startGetLocation();
    }

    function startGetLocation() {

    var callbackFn = function(location) {
        console.log('[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude);
        var latitude = location.latitude;
        var longitude = location.longitude;
        var pontos = [];
        if($localStorage.getPontosGps() && $localStorage.getPontosGps().pontos){
          pontos = $localStorage.getPontosGps().pontos;
        }


        $log.log('lat: ' + latitude);
        $log.log('long: ' + longitude);

        if (!_.find(pontos, {
            latitude: latitude,
            longitude: longitude
          })) {

          pontos.push({
            latitude: latitude,
            longitude: longitude,
            velocidade: null
          });

          $localStorage.setPontosGps({
            isRunning: true,
            pontos: pontos
          });
        }
        backgroundGeoLocation.finish();
      };

      var failureFn = function(error) {
        console.log('BackgroundGeoLocation error: ' + error);
      };

      backgroundGeoLocation.configure(callbackFn, failureFn, {
        desiredAccuracy: 10,
        stationaryRadius: 20,
        distanceFilter: 30,
        debug: false,
        stopOnTerminate: false,
        locationTimeout: 10,
        notificationTitle: 'Diário de Bordo', // <-- android only, customize the title of the notification
        notificationText: 'Coletando pontos em segundo plano'
      });

      backgroundGeoLocation.start();

    }

  }
})();
