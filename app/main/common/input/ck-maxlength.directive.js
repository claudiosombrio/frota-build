'use strict';

(function () {
    angular.module('app.common')
        .directive('ckMaxLength', ckMaxLength);

    ckMaxLength.$inject = [];

    function ckMaxLength() {
        var dc = {};

        dc.restrict = 'A';
        dc.require = 'ngModel';

        dc.link = myLink;

        function myLink(scope, element, attrs, ngModelCtrl) {
          var maxlength = Number(attrs.ckMaxLength);
          function fromUser(text) {
            if (text && text.toString().length > maxlength) {
              var transformedInput = text.toString().substring(0, maxlength);
              ngModelCtrl.$setViewValue(transformedInput);
              ngModelCtrl.$render();
              return transformedInput;
            }
            return text;
          }
          ngModelCtrl.$parsers.push(fromUser);
        }

        return dc;
    }

})();
