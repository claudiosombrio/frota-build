'use strict';

(function () {
    angular.module('app.common')
        .directive('ckButtonTime', ckButtonTime)
      .controller('ButtonTimeCtrl', ButtonTimeCtrl);

    ckButtonTime.$inject = [];

    function ckButtonTime() {
      var dc = {};

      dc.template = '<button class="button button-fab button-small button-calm" ' +
        'ng-click="vm.openTimePicker(); $event.stopPropagation();">' +
        '<ng-transclude></ng-transclude>' +
        '</button>';

      dc.scope = {};
      dc.scope.ngModel = '=';
      dc.scope.onTap = '=';
      dc.scope.listener = '=';
      dc.transclude = true;

      dc.controller = 'ButtonTimeCtrl';
      dc.controllerAs = 'vm';

      return dc;
    }

    ButtonTimeCtrl.$inject = ['$scope', '$dateTimePicker'];

    function ButtonTimeCtrl($scope, $dateTimePicker){
      var vm = this;

      vm.openTimePicker = openTimePicker;

      function openTimePicker(){
        $dateTimePicker.openTime($scope.ngModel, $scope.onTap).then(function(data){
          $scope.ngModel = data;
          $scope.listener(data);
        });
      }
    }

})();
