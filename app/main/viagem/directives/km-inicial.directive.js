'use strict';

(function () {
    angular.module('app.viagem')
        .directive('inputKmInicial', inputKmInicial)
      .controller('InputKmInicialCtrl', InputKmInicialCtrl);

    inputKmInicial.$inject = [];

    function inputKmInicial() {
        var dc = {};

        dc.templateUrl = 'main/viagem/directives/km-inicial.template.html';

        dc.require = 'ngModel';

        dc.scope = {};
        dc.scope.kmFinal = '=';
        dc.scope.ngModel = '=';
        dc.scope.kmForm = '=';
        dc.scope.ngChange = '=';

        dc.controller = 'InputKmInicialCtrl';
        dc.controllerAs = 'vm';

        return dc;
    }

    InputKmInicialCtrl.$inject = ['$scope'];

    function InputKmInicialCtrl($scope){
      var vm = this;

      vm.refreshModel = refreshModel;

      $scope.$watch('::ngModel', function(value){
        vm.model = value;
      });

      function refreshModel(){
        $scope.ngModel = vm.model;

        if($scope.ngChange){
          $scope.ngChange();
        }
      }
    }

})();
