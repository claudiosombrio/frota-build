'use strict';
(function () {
  angular.module('main', [
    'ionic',
    'ngCordova',
    'ui.router',
    'ionic-material',
    'ajoslin.promise-tracker',
    'pasvaz.bindonce',
    'material-design-icons',
    'timer',
    'ngMessages',
    'ui.utils.masks',
    'ui.validate',
    'ngTouch',
    'restangular',

    'app.common',
    'app.database',
    'app.usuario',
    'app.viagem',
    'app.sincronizacao',
    'app.cidade',
    'app.roteiro',
    'app.passageiro'
  ]);
})();
