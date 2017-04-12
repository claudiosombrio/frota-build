'use strict';

(function() {
  angular.module('app.viagem')
    .controller('viagem.CadastroViagemCtrl', CadastroViagemCtrl);

  CadastroViagemCtrl.$inject = ['$injector', 'promiseTracker', '$moment', '$scope', '$localStorage', '$state', '$rootScope', '$ionicPopup'];

  function CadastroViagemCtrl($injector, promiseTracker, $moment, $scope, $localStorage, $state, $rootScope, $ionicPopup) {
    var vm = this,
      ViagemService = $injector.get('ViagemService'),
      LoginEventEmitter = $injector.get('LoginEventEmitter');

      var RoteiroService = $injector.get('RoteiroService');
      var MotoristaService = $injector.get('MotoristaService');
      RoteiroService.listAll(0, 1)
        .then(function(data){
          if(data.length > 0 || vm.viagem.codigoRoteiro){
            vm.roteiroExiste = true;
          }else{
            vm.roteiroExiste = undefined;
          }
        });


    init();
    var VIAGEM_DEFAULT = {
      destino:  $localStorage.getCidadePadrao().codigo,
      nomeDestino: $localStorage.getCidadePadrao().descricao,
      saida: $moment(),
      chegada: $moment(),
      kmInicial: null,
      kmFinal: null,
      observacao: null
    };

    function init() {
      vm.tracker = {};
      vm.tracker.saving = promiseTracker();
      vm.tracker.loading = promiseTracker();
      vm.goCidade = goCidade;
      vm.goRoteiro = goRoteiro;
      vm.saidaListener = saidaListener;
      vm.chegadaListener = chegadaListener;

      vm.save = save;
      vm.cancel = cancel;
      vm.focus = focus;
        vm.tracker.loading.addPromise(ViagemService.getToEdit().then(function(data) {
          console.log(data);
          vm.viagem = data || $localStorage.getViagemToEdit() || VIAGEM_DEFAULT;
          vm.viagem.motorista = $localStorage.getUsuario();
          vm.viagem.veiculo = $localStorage.getVeiculo();
          RoteiroService.getRoteiro(vm.viagem.codigoRoteiro).then(function(data){
            var  roteiro = data;
            if(roteiro){
              $localStorage.setRoteiro(roteiro[0])
            }
          }, function(data){
            console.log(data);
          });
          $localStorage.setDataSaida(vm.viagem.saida);
          $localStorage.setDataChegada(vm.viagem.chegada);
        }))

    }

    function goCidade() {
      $localStorage.setViagemToEdit(vm.viagem);
      $state.go('app.cidade');
    }

    function goRoteiro() {
      $localStorage.setViagemToEdit(vm.viagem);
      RoteiroService.setNextState('app.cad-viagem');
      RoteiroService.setLabel('Nova Viagem!');
      $state.goNoHistory('app.roteiro');
    }

    $rootScope.$on('citychanged', function(event, cidade) {
      console.log(event)
      vm.viagem =   $localStorage.getViagemToEdit();
      vm.viagem.destino = cidade.codigo;
      vm.viagem.nomeDestino = cidade.descricao;
      $localStorage.setViagemToEdit(vm.viagem);
      console.log(vm.viagem);
      $scope.$apply();
    });

    $rootScope.$on('roteirochanged', function(event, roteiro) {
      if(roteiro){
        vm.viagem = $localStorage.getViagemToEdit();
        vm.viagem.destino = roteiro.codigoCidade;
        vm.viagem.nomeDestino = roteiro.destino;
        vm.viagem.chegada = roteiro.chegada;
        vm.viagem.saida = roteiro.saida;
        vm.viagem.codigoRoteiro = roteiro.codigo;
        MotoristaService.getPorProfissional(roteiro.profissional).then(function(data){
            var userToStorage = _.pick(data, 'codigo', 'nome', 'login', 'usuario');
            vm.viagem.motorista = userToStorage;
            $localStorage.setRoteiro(roteiro);
        });
        $localStorage.setRoteiro(roteiro)
      }

      // if(!save()){
      //   vm.viagem = $localStorage.getViagemToEdit()
      // }else{
      //   $localStorage.setViagemToEdit(vm.viagem);
      // }
      $scope.$apply();
    });

    function saidaListener(data){
        $localStorage.setRoteiro(null);
        vm.viagem.codigoRoteiro = undefined;
        $localStorage.setDataSaida(data);
        if($localStorage.getDataChegada().isBefore($localStorage.getDataSaida())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A saída não pode ser maior do que a data de chegada.'
         });
          $localStorage.setDataSaida(data);
          vm.isvalidasaida = true;
        }else{
          vm.isvalidasaida = false;
        }
        vm.viagem.saida = data;

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

    function save() {
      if(vm.isvalidasaida){
        $ionicPopup.alert({
         title: 'Atenção',
         template: 'A saída não pode ser maior do que a data de chegada.'
       });
       return false;
      }
      if (vm.viagem.kmInicial >= vm.viagem.kmFinal) {
        $ionicPopup.alert({
         title: 'Atenção',
         template: 'O KM Inicial não pode ser maior que o KM Final'
        });
        return false;
      }
      var STATE_TO = 'app.viagens';

      vm.form.$setSubmitted(true);

      var eventAfterValidate = function() {
        console.log(vm.viagem)
        vm.tracker.saving.addPromise(
          ViagemService.save(vm.viagem).then(function(data) {
            vm.viagem = data;
            $state.goNoHistory(STATE_TO);
          }, function(data){
            console.log(data);
          })
        );
      };

      if (vm.form.$valid) {
        LoginEventEmitter.onSave(eventAfterValidate).then(function(valid) {
          if (valid) {
            eventAfterValidate();
          }
        });
      }
      return true;
    }

    function cancel() {
      $state.goNoHistory('app.viagens');
    }

    function focus(id, event) {
      event.stopPropagation();
      $('#' + id).focus();
    }

  }

})();
