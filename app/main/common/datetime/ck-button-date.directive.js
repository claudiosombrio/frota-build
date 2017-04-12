'use strict';

(function () {
    angular.module('app.common')
        .directive('ckButtonDate', ckButtonDate)
        .controller('ButtonDateCtrl', ButtonDateCtrl);

    ckButtonDate.$inject = [];

    function ckButtonDate() {
      var dc = {};

      dc.template = '<button class="button button-fab button-small button-calm" ' +
        'ng-click="vm.openDatePicker(); $event.stopPropagation();">' +
        '<ng-transclude></ng-transclude>' +
        '</button>';

      dc.require = 'ngModel';

      dc.scope = {};
      dc.scope.ngModel = '=';
      dc.scope.onTap = '=';
      dc.scope.listener = '=';
      dc.transclude = true;

      dc.controller = 'ButtonDateCtrl';
      dc.controllerAs = 'vm';

      return dc;
    }

    ButtonDateCtrl.$inject = ['$scope','$dateTimePicker'];

    function ButtonDateCtrl($scope, $dateTimePicker){
      var vm = this;

      vm.openDatePicker = openDatePicker;

      function openDatePicker(){
        $dateTimePicker.openDate($scope.ngModel, $scope.onTap).then(function(data){
          $scope.ngModel = data;
          $scope.$applyAsync();
          $scope.listener(data);
        });
      }


    }

})();
