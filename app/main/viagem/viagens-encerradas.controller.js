'use strict';

(function () {
    angular.module('app.viagem')
        .controller('viagem.ViagensEncerradasCtrl', ViagensEncerradasCtrl);

    ViagensEncerradasCtrl.$inject = ['$scope','promiseTracker', '$log', '$state', '$injector', '$localStorage', '$q', '$ionicUtils', '$moment'];

    function ViagensEncerradasCtrl($scope,promiseTracker, $log, $state, $injector,$localStorage, $q, $ionicUtils, $moment) {
        var vm = this, mainEvent;

        var ViagemService = $injector.get('ViagemService');
        var popup = $injector.get('popup');
        var firstRow = 0, ROWS = 9;
        var StringBuilder = $injector.get('StringBuilder');
        var $dateTimePicker = $injector.get('$dateTimePicker');
        vm.estadosViagem = $localStorage.getEstadoViagem();
        vm.canLoad = true;
        $localStorage.setRoteiro(null);


        vm.tracker = {};
        vm.tracker.loading = promiseTracker();
        vm.tracker.deleting = promiseTracker();

        //functions to bind
        vm.toDelete = toDelete;
        vm.edit = edit;
        vm.novaViagem = novaViagem;
        vm.deleteViagem = deleteViagem;
        vm.loadMoreData = loadMoreData;
        vm.search = search;
        vm.clear = clear;
        vm.changeDate = changeDate;

        init();

        function init(){
          vm.motorista = $localStorage.getUsuario();
          vm.veiculo = $localStorage.getVeiculo();
          $localStorage.setViagemToEdit(null);
        }

        function toDelete(item){
          var deleting = function (){
            item.toDelete = !item.toDelete;
          };

          vm.tracker.deleting.addPromise($q.when(deleting()));
        }

        function edit(item){
          $log.log(item);
          ViagemService.toEdit(item);
          $state.go('app.cad-viagem');
        }

        function novaViagem(){
          $state.go('app.cad-viagem');
        }

        function deleteViagem(viagem){
          vm.tracker.deleting.addPromise(
            ViagemService.remove(viagem.codigo)
              .then(function(){
                   vm.viagens.splice(vm.viagens.indexOf(viagem), 1);
               popup.info('Viagem removida com sucesso!');

               $state.reload($state.current);
          }));
        }

        function getFilter(){
          var filter = {};
          if(vm.busca){
            filter['keyword LIKE ?'] = '%'+vm.busca+'%';
          }

          if(vm.buscaSaida){
            var like = StringBuilder.create()
              .append('strftime("%Y-%m-%d", saida)')
              .append(' = ')
              .append('strftime("%Y-%m-%d", "')
              .append($moment(vm.buscaSaida).toString())
              .append('")')
              .toString();

            filter[like] = null;

          }

          return filter;
        }

        function clear(model){
          vm[model] = null;
          search({type:mainEvent});
        }

        function search(event){
          if(!mainEvent){
            mainEvent = event.type;
          }

          if(angular.isString(mainEvent) && angular.isString(event.type) && mainEvent.toLowerCase() === event.type.toLowerCase()){
            vm.canLoad = true;
            vm.viagens = [];
            firstRow = 0;
            $ionicUtils.toTop();
            loadMoreData();
          }

        }

        function loadMoreData(){
          var filter = getFilter();

          return ViagemService.createQueryListBuilder()
            // .motorista(vm.motorista)
            // .veiculo(vm.veiculo)
            .linhaInicio(firstRow)
            .rangeQuery(ROWS)
            .filter(filter)
            .build()
            .then(function(data){

              if(!angular.isArray(vm.viagens)){
                vm.viagens = [];
              }

              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(viagem){
                  vm.viagens.push(viagem);
                });

                firstRow += ROWS;
              }

              vm.canLoad =!(data.length < ROWS);

              $scope.$broadcast('scroll.infiniteScrollComplete');
              $scope.$broadcast('scroll.refreshComplete');
            }, $log.error);

        }

        function changeDate(){
          $dateTimePicker.openDate(vm.buscaSaida).then(function(data){
            vm.buscaSaida = data;
            $scope.$applyAsync();
          });
        }

    }

})();
