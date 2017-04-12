'use strict';

(function () {
    angular.module('app.sincronizacao')
        .config(Sincronizando);

    function Sincronizando(RestangularProvider) {
      RestangularProvider.setDefaultHeaders({ 'Content-Type': 'application/json' });
    }
})();
