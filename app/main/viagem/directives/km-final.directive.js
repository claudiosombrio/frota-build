'use strict';

(function () {
    angular.module('app.viagem')
        .directive('inputKmFinal', inputKmFinal)
      .controller('InputKmFinalCtrl',InputKmFinalCtrl);

    inputKmFinal.$inject = [];

    function inputKmFinal() {
        var dc = {};

        dc.templateUrl = 'main/viagem/directives/km-final.template.html';

        dc.require = 'ngModel';

        dc.scope = {};
        dc.scope.kmInicial = '=';
        dc.scope.ngModel = '=';
        dc.scope.kmForm = '=';
        dc.scope.ngChange = '=';

        dc.controller = 'InputKmFinalCtrl';
        dc.controllerAs = 'vm';

        return dc;
    }

    InputKmFinalCtrl.$inject = ['$scope'];

    function InputKmFinalCtrl($scope){
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
