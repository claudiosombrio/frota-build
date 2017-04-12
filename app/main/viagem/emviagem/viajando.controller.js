'use strict';

(function () {
    angular.module('app.viagem')
        .controller('viagem.ViajandoCtrl', ViajandoCtrl);

    ViajandoCtrl.$inject = [ 'LoginEventEmitter', '$state', '$injector', '$scope', '$dateTimePicker', '$localStorage', '$moment', '$ionicPopup'];

    function ViajandoCtrl( LoginEventEmitter,$state, $injector, $scope, $dateTimePicker, $localStorage, $moment, $ionicPopup) {
      var vm = this;

      var ViagemService = $injector.get('ViagemService');
      var MotoristaService = $injector.get('MotoristaService');
      var VeiculoService = $injector.get('VeiculoService');
      var RoteiroService = $injector.get('RoteiroService');
      vm.encerrar = encerrar;
      vm.goSelectMotorista = MotoristaService.changeSelection;
      vm.goSelectVeiculo = VeiculoService.changeSelection;
      vm.refreshSaida = refreshSaida;
      vm.saidaListener = saidaListener;
      init();
      function init(){
        ViagemService.fromStorage().then(function(data){
          vm.viagem = data;
          vm.viagem.motorista = $localStorage.getUsuario();
          vm.viagem.veiculo = $localStorage.getVeiculo();
          vm.viagem.saida = $localStorage.getDataSaida();
          if(vm.viagem.codigoRoteiro){
            RoteiroService.getRoteiro(vm.viagem.codigoRoteiro).then(function(result){
              $localStorage.setRoteiro(result[0]);
            })
          }
          startTempoViagem();
          $scope.$emit('CAPTAR::PONTOS');
        });
        if($localStorage.getRoteiro()){
          $localStorage.setRoteiroM($localStorage.getRoteiro());
        }else if($localStorage.getRoteiroM()){
            $localStorage.setRoteiro($localStorage.getRoteiroM());
          }

      }

      function encerrar(){

        if(vm.disabilitar){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A saída não pode ser maior do que a data atual.'
         });
         return;
        }

        var eventAfterValidate = function(){
          ViagemService.toStorage(vm.viagem)
            .then(function(){
              $scope.$emit('ESTADO::VIAGEM', { encerrando: true });
              $state.go('app.encerrando-viagem');
            });
        };

        LoginEventEmitter.onSave(eventAfterValidate).then(function(valid){
          if(valid) {
            eventAfterValidate();
          }
        });
      }

      function startTempoViagem(){
        vm.initTempoViagem = vm.viagem.saida.valueOf();
      }

      function refreshSaida(){
        var timer = _.first($('.timer-card').find('timer'));

        if(timer){
          timer.stop();
          startTempoViagem();
          timer.start();
        }
      }

      function saidaListener(data){
          $localStorage.setDataSaida(data);
          if($moment().isBefore($localStorage.getDataSaida())){
            $ionicPopup.alert({
             title: 'Atenção',
             template: 'A saída não pode ser maior do que a data atual.'
           });
           $localStorage.setDataChegada(data);
           vm.disabilitar = true;
         }else{
           vm.disabilitar = false;
         }
          vm.viagem.saida = $localStorage.getDataSaida();
          refreshSaida();

      }

     }

})();
