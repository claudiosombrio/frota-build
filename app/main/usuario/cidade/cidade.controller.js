'use strict';

(function () {

    angular.module('app.cidade')
        .controller('cidade.SelectCidadeCtrl', SelectCidadeCtrl);

    SelectCidadeCtrl.$inject = ['$scope', '$injector', 'promiseTracker', '$ionicUtils','$state', '$localStorage', '$rootScope', '$window']

    function SelectCidadeCtrl($scope, $injector, promiseTracker, $ionicUtils, $state, $localStorage, $rootScope, $window) {
      var vm = this;
      var CidadeService = $injector.get('CidadeService');
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
        vm.onlySelection = CidadeService.isOnlySelection();
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
        var cityToStorage = _.pick(vm.itemSelected, 'codigo', 'descricao');

        // var nextStep = function(){
          InitConfigService.setConfigInitApp(null);
          setTimeout( function() {
            $window.history.back();
          }, 500 );
        // };
        $localStorage.setCidade(cityToStorage)
        $rootScope.$broadcast('citychanged', cityToStorage);
        // return nextStep;
      }

      function cancelSelection(){
        vm.itemSelected = null;

        if(vm.onlySelection){
          setTimeout( function() {
            $window.history.back();
          }, 500 );
        }
      }

      function loadMoreData(){
        var filter = vm.busca ? { 'where descricao like ? ': '%'+vm.busca+'%' } : undefined;

        return CidadeService.listAll(filter, firstRow, ROWS)
          .then(function(data){
            if(!angular.isArray(vm.cidades)){
              vm.cidades = [];
            }

            if(data){
              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(cidade){
                  vm.cidades.push(cidade);
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
          vm.cidades = [];
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
