'use strict';

(function () {

    angular.module('app.usuario')
        .controller('usuario.SelectMotoristaCtrl', SelectMotoristaCtrl);

    SelectMotoristaCtrl.$inject = ['$scope', '$injector', 'promiseTracker', '$ionicUtils','$state', '$localStorage'];

    function SelectMotoristaCtrl($scope, $injector, promiseTracker, $ionicUtils, $state, $localStorage) {
      var vm = this;
      var CidadeService = $injector.get('CidadeService');
      var popup = $injector.get('popup');
      var MotoristaService = $injector.get('MotoristaService');
      var InitConfigService = $injector.get('InitConfigService');

      var firstRow = 0, ROWS = 9, mainEvent, mainEventSelect;

      vm.tracker = {};
      vm.tracker.loading = promiseTracker();
      vm.canLoad = true;
      vm.loadMoreData = loadMoreData;

      vm.selectItem = selectItem;
      vm.nextStep = nextStep;
      vm.cancelSelection = cancelSelection;
      vm.search = search;
      vm.clear = clear;

      init();

      function init(){
        vm.onlySelection = MotoristaService.isOnlySelection();
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
        var userToStorage = _.pick(vm.itemSelected, 'codigo', 'nome', 'login', 'usuario');
        CidadeService.get(vm.itemSelected.codigoCidade).then(function(data)  {
          $localStorage.setCidadePadrao(data);
          $localStorage.setCidade(data);
        })

        var nextStep = function(){
          InitConfigService.setConfigInitApp(null);
          $state.go(MotoristaService.getNextState());
        };

        popup.password($scope, userToStorage, nextStep);
      }

      function cancelSelection(){
        vm.itemSelected = null;

        if(vm.onlySelection){
          $state.goNoHistory(MotoristaService.getNextState());
        }
      }

      function loadMoreData(){
        var filter = vm.busca ? { 'm.nome like ? ': '%'+vm.busca+'%' } : undefined;

        return MotoristaService.listAll(filter, firstRow, ROWS)
          .then(function(data){
            if(!angular.isArray(vm.motoristas)){
              vm.motoristas = [];
            }

            if(data){
              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(motorista){
                  vm.motoristas.push(motorista);
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

      function search(event){
        if(!mainEvent){
          mainEvent = event.type;
        }

        if(angular.isString(mainEvent) && angular.isString(event.type) && mainEvent.toLowerCase() === event.type.toLowerCase()){
          vm.canLoad = true;
          vm.motoristas = [];
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
