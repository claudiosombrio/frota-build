'use strict';

(function () {
    angular.module('app.roteiro')
        .controller('usuario.SelectRoteiroCtrl', SelectRoteiroCtrl);

    SelectRoteiroCtrl.$inject = ['$scope','$state', '$localStorage', 'promiseTracker', '$injector', '$ionicUtils', '$rootScope', '$window'];

    function SelectRoteiroCtrl($scope, $state, $localStorage, promiseTracker, $injector, $ionicUtils, $rootScope, $window) {
      var vm = this;
      var RoteiroService = $injector.get('RoteiroService');
      // var popup = $injector.get('popup');
      var firstRow = 0, ROWS = 9, mainEvent, mainEventSelect;

      vm.tracker = {};
      vm.tracker.loading = promiseTracker();
      vm.canLoad = true;

      vm.selectItem = selectItem;
      vm.nextStep = nextStep;
      vm.comeBack = comeBack;
      vm.label = RoteiroService.getLabel();
      vm.loadMoreData = loadMoreData;
      vm.clear = clear;
      $localStorage.setRoteiro(undefined);

      vm.search = search;

      init();

      function init(){
        vm.onlySelection = RoteiroService.isOnlySelection();
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
        $localStorage.setRoteiro(vm.itemSelected);
        $localStorage.setHorario(moment());
        // if(!!vm.itemSelected  && userToStorage.codigo !== $localStorage.getUsuario().codigo){
        //   popup.password($scope, userToStorage, RoteiroService.getNextState());
        // }else{
        if(userToStorage.nome){
          $localStorage.setUsuario(userToStorage);
        }

          $state.goNoHistory(RoteiroService.getNextState())
        // }
        // if(!vm.itemSelected){
        //   vm.itemSelected = {};
        // }
          $rootScope.$broadcast('roteirochanged', vm.itemSelected);
      }

      function comeBack(){
        vm.itemSelected = null;
        $localStorage.setRoteiro(null);
        setTimeout( function() {
          $window.history.back();
        }, 500 )
      }

      function loadMoreData(){

        return RoteiroService.listAll(firstRow, ROWS)
          .then(function(data){
            if(!angular.isArray(vm.roteiros)){
              vm.roteiros = [];
            }

            if(data){
              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(roteiro){
                  vm.roteiros.push(roteiro);
                });

                firstRow += ROWS;
              }

              vm.canLoad = !(data.length<ROWS);
            }else{
              vm.canLoad = false;
            }
            console.log(vm.roteiros.length)
            if(vm.roteiros.length === 0){
              if(RoteiroService.getNextState() === 'app.novaviagem'){
                $localStorage.setRoteiro(undefined)
                $state.goNoHistory(RoteiroService.getNextState());
              }
              return;
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
          vm.roteiros = [];
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
