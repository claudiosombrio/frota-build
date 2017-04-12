'use strict';

(function () {
  angular.module('app.viagem')
  .controller('viagem.EncerrarViagemCtrl', EncerrarViagemCtrl);

  EncerrarViagemCtrl.$inject = ['$injector', '$state', '$moment', 'popup', '$scope', '$dateTimePicker', '$localStorage', '$ionicPopup'];

  function EncerrarViagemCtrl($injector, $state, $moment, popup, $scope, $dateTimePicker, $localStorage, $ionicPopup) {
    var vm = this;

    var LoginEventEmitter = $injector.get('LoginEventEmitter');
    var ViagemService = $injector.get('ViagemService');
    var MotoristaService = $injector.get('MotoristaService');
    var VeiculoService = $injector.get('VeiculoService');

    init();

    function init() {
      ViagemService.fromStorage().then(function (data) {
        vm.viagem = data;
        $localStorage.setDataChegada($moment());
        vm.viagem.motorista = $localStorage.getUsuario();
        vm.viagem.veiculo = $localStorage.getVeiculo();

        vm.viagem.chegada = $localStorage.getDataChegada();
        vm.viagem.saida = $localStorage.getDataSaida();
        vm.saidaListener = saidaListener;
        vm.chegadaListener = chegadaListener;
      });
    }

    //public methods
    vm.finalizarEncerramento = finalizarEncerramento;
    vm.goSelectMotorista = MotoristaService.changeSelection;
    vm.goSelectVeiculo = VeiculoService.changeSelection;
    vm.focus = focus;


    function finalizarEncerramento() {

      vm.form.$setSubmitted(true);

      $scope.$emit('PARAR::CAPTAR::PONTOS');

      save();
    }

    function save() {
      var eventAfterValidate = function () {
        if ($localStorage.getPontosGps()) {
          vm.viagem.pontosTrajeto = $localStorage.getPontosGps().pontos;
        }
        if (vm.viagem.kmInicial >= vm.viagem.kmFinal) {
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'O KM Inicial não pode ser maior que o KM Final'
          });
          return;
        }
        // console.log(vm.viagem);
        var destino = vm.viagem.destino;
        vm.viagem.destino =  destino.codigo;
        vm.viagem.nomeDestino = destino.descricao;

        ViagemService.insert(vm.viagem)
        .then(function (result) {
          if (result && result.insertId) {
            vm.viagem.codigo = result.insertId;
          }
          vm.viagem.veiculo.km = vm.viagem.kmFinal;
          $localStorage.setVeiculo(vm.viagem.veiculo);
          VeiculoService.update(vm.viagem.veiculo);

          $localStorage.setPontosGps({
            isRunning: false
          });

          popup.info('Viagem Finalizada!').then(function () {
            $scope.$emit('ESTADO::VIAGEM', {novaViagem: true});
            $localStorage.setRoteiroM(null)
            $state.goNoHistory('app.inicio');
          });
        });
      };

      if (vm.form.$valid) {
        LoginEventEmitter.onSave(eventAfterValidate).then(function (valid) {
          if (valid) {
            eventAfterValidate();
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

    function chegadaListener(data){
        $localStorage.setDataChegada(data);
        if($localStorage.getDataSaida().isAfter($localStorage.getDataChegada())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A chegada não pode ser menor do que a saída.'
         });
          $localStorage.setDataChegada($moment());
        }

        if(moment().isBefore($localStorage.getDataChegada())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A chegada não pode ser maior que a data atual.'
         });
         $localStorage.setDataChegada($moment());
       }
        vm.viagem.chegada = $localStorage.getDataChegada();

    }
    // HACK:

    function focus(id, event) {
      event.stopPropagation();
      $('#' + id).focus();
    }

    $scope.$watch('vm.viagem.kmFinal', function (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (!newValue || !vm.viagem.kmInicial || vm.viagem.kmInicial > newValue) {
          vm.distanciaPercorrida = null;
        } else {
          vm.distanciaPercorrida = vm.viagem.kmFinal - vm.viagem.kmInicial;

        }
      }
    });

    $scope.$watch('vm.viagem.kmInicial', function (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (!newValue || !vm.viagem.kmFinal || newValue > vm.viagem.kmFinal) {
          vm.distanciaPercorrida = null;
        } else {
          vm.distanciaPercorrida = vm.viagem.kmFinal - vm.viagem.kmInicial;
        }
      }
    });
  }

})();
