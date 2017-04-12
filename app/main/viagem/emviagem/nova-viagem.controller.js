'use strict';

(function() {
  angular.module('app.viagem')
    .controller('viagem.NovaViagemCtrl', NovaViagemCtrl);

  NovaViagemCtrl.$inject = ['$localStorage', '$injector', '$state', '$moment', '$scope', '$dateTimePicker', '$rootScope', '$ionicPopup'];

  function NovaViagemCtrl($localStorage, $injector, $state, $moment, $scope, $dateTimePicker, $rootScope, $ionicPopup) {
    var vm = this;
    var LoginEventEmitter = $injector.get('LoginEventEmitter');
    var ViagemService = $injector.get('ViagemService');
    var MotoristaService = $injector.get('MotoristaService');
    var VeiculoService = $injector.get('VeiculoService');
    var RoteiroService = $injector.get('RoteiroService');
    RoteiroService.setLabel('Nova Viagem!');

    var EstadoViagem = $localStorage.getEstadoViagem();

    vm.viagem = {};

    init();

    function init() {
      $rootScope.listPassageiros = undefined;
      vm.viagem.motorista = $localStorage.getUsuario();
      vm.viagem.veiculo = $localStorage.getVeiculo();
      vm.saidaListener = saidaListener;
      vm.initKm = initKm;
      var localRoteiro = $localStorage.getRoteiro();
      if(localRoteiro){
        var cidadeToStorage = {}
        cidadeToStorage.codigo = localRoteiro.codigoCidade;
        cidadeToStorage.descricao = localRoteiro.destino;
        $localStorage.setCidade(cidadeToStorage)
        vm.viagem.codigoRoteiro = localRoteiro.codigoRoteiro;
        vm.viagem.localSaida = localRoteiro.localSaida;
        vm.viagem.saida = $localStorage.getDataSaida() || $moment();
      }else{
        vm.viagem.saida = $moment();
        vm.viagem.chegada = $moment();
        $localStorage.setDataSaida(vm.viagem.saida);
        $localStorage.setDataChegada(vm.viagem.chegada)
      }
      vm.viagem.destino = $localStorage.getCidade();

      if (EstadoViagem.novaViagem) {
        ViagemService.list(vm.viagem.veiculo)
          .then(function(data) {
            var viagem = _.first(data);

            if (viagem) {
              if(vm.viagem.kmFinal || vm.viagem.veiculo.km === null){
                vm.viagem.veiculo.km = vm.viagem.kmFinal;
              }
            }

          });
      } else {
        vm.viagem = $localStorage.getViagem();
      }
    }

    vm.iniciaViagem = iniciaViagem;
    vm.goSelectMotorista = MotoristaService.changeSelection;
    vm.goSelectVeiculo = VeiculoService.changeSelection;
    vm.goCidade = goCidade;

    function goCidade() {
      $state.go('app.cidade');
    }
    function initKm(){
      vm.viagem.kmInicial = vm.viagem.veiculo.km ;
      $localStorage.setVeiculo(vm.viagem.veiculo);
      VeiculoService.update(vm.viagem.veiculo);
    }
    function iniciaViagem() {
      vm.form.$setSubmitted(true);
      if($localStorage.getRoteiro()){
        vm.viagem.codigoRoteiro = $localStorage.getRoteiro().codigoRoteiro
      }

      var eventAfterValidate = function() {
        ViagemService.toStorage(vm.viagem)
          .then(function() {
            $scope.$emit('ESTADO::VIAGEM', {
              viajando: true
            });
            $state.goNoHistory('app.viajando');

          });
      };

      if (vm.form.$valid) {
        LoginEventEmitter.onSave(eventAfterValidate).then(function(valid) {
          if (valid) {
            ViagemService.toStorage(vm.viagem)
              .then(eventAfterValidate);
          }
        });
      }
    }

    function saidaListener(data){
        $localStorage.setDataSaida(data);
        if($moment().isBefore($localStorage.getDataSaida())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A saída não pode ser maior do que a data atual.'
         });
          $localStorage.setDataSaida($moment());
        }
        vm.viagem.saida = $localStorage.getDataSaida();

    }

  }

})();
