'use strict';

(function () {
    angular.module('app.passageiro')
        .controller('listapassageiroctrl', function($scope, $localStorage, $state, $injector){
          var vm = this;
          var PassageiroService = $injector.get('PassageiroService');
            setTimeout(function (){
              console.log($scope.codigoRoteiro)
              PassageiroService.list(0, 1, $scope.codigoRoteiro).then(function(data) {
                if(data.length > 0){
                  vm.passageiroExiste = true;
                }else{
                  vm.passageiroExiste = undefined;
                }
              })
            }, 1000)
          vm.togglePassageiro = function(){
            if(!vm.passageiroExiste){
              return;
            }
            if($scope.readonly === 'true'){
              $localStorage.setReadOnlyPassageiros(true);
            }else{
              $localStorage.setReadOnlyPassageiros(undefined);
            }

            $state.go('app.passageiro')
          }
        })
        .directive('listapassageiro', listapassageiro);

    listapassageiro.$inject = [];

    function listapassageiro() {
        var dc = {};

        dc.templateUrl = 'main/usuario/passageiros/listapassageiro.html';

        dc.scope = {};
        dc.scope.label = '@';
        dc.scope.readonly = '@';
        dc.scope.size = '@';
        dc.scope.layout = '@';
        dc.scope.codigoRoteiro = '=';
        dc.controller = 'listapassageiroctrl';
        dc.controllerAs = 'vm';


        return dc;
    }


})();
