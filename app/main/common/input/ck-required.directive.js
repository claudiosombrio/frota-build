'use strict';

(function () {
    angular.module('app.common')
        .directive('ckRequired', ckRequired);

    ckRequired.$inject = [];

    function ckRequired() {
        var dc = {};

        dc.restrict = 'A';
        dc.require = 'ngModel';

        dc.link = myLink;

        function myLink(scope, elm, attrs, ctrl){
          scope.$watch(attrs.ngModel, function(val) {
            ctrl.$setValidity('ck-required', !!val);
          });
        }

        return dc;
    }

})();
