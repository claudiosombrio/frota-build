'use strict';

(function () {
    angular.module('app.usuario')
        .controller('usuario.SelectVeiculoCtrl', SelectVeiculoCtrl);

    SelectVeiculoCtrl.$inject = ['$scope','$state', '$localStorage', 'promiseTracker', '$injector', '$ionicUtils'];

    function SelectVeiculoCtrl($scope, $state, $localStorage, promiseTracker, $injector, $ionicUtils) {
      var vm = this;
      var VeiculoService = $injector.get('VeiculoService');

      var firstRow = 0, ROWS = 9, mainEvent, mainEventSelect;

      vm.tracker = {};
      vm.tracker.loading = promiseTracker();
      vm.canLoad = true;

      vm.selectItem = selectItem;
      vm.nextStep = nextStep;
      vm.comeBack = comeBack;
      vm.loadMoreData = loadMoreData;
      vm.clear = clear;

      vm.search = search;

      init();

      function init(){
        vm.onlySelection = VeiculoService.isOnlySelection();
      }

      function selectItem(item, event){
        if(!mainEventSelect){
          mainEventSelect = event.originalEvent.constructor.name;
        }

        if(mainEventSelect === event.originalEvent.constructor.name){

          if(!!vm.itemSelected && item.codigo!==vm.itemSelected.codigo){
            vm.itemSelected.selected = false;
          }

          item.selected = !item.selected;

          vm.itemSelected = !item.selected ? null : item;
        }

      }

      function nextStep(){
        $localStorage.setVeiculo(vm.itemSelected);
        $localStorage.setHorario(moment());

        $state.goNoHistory(VeiculoService.getNextState());
      }

      function comeBack(){
        vm.itemSelected = null;

        $state.goNoHistory(VeiculoService.getNextState());
      }

      function loadMoreData(){
        var filter = vm.busca ? { 'descricao like ? ': '%'+vm.busca+'%' } : undefined;

        return VeiculoService.listAll(filter, firstRow, ROWS)
          .then(function(data){
            if(!angular.isArray(vm.veiculos)){
              vm.veiculos = [];
            }

            if(data){
              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(veiculo){
                  vm.veiculos.push(veiculo);
                });

                firstRow += ROWS;
              }

              vm.canLoad = !(data.length<ROWS);
            }else{
              vm.canLoad = false;
            }

            $scope.$broadcast('scroll.infiniteScrollComplete');
          });
      }

      function search(){
        if(!mainEvent){
          mainEvent = event.type;
        }

        if(angular.isString(mainEvent) && angular.isString(event.type) && mainEvent.toLowerCase() === event.type.toLowerCase()){
          vm.canLoad = true;
          vm.veiculos = [];
          firstRow = 0;
          $ionicUtils.toTop();
          loadMoreData();
        }
      }

      function clear(model){
        vm[model] = null;

        search({type: mainEvent});
      }
    }

})();
