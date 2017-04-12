'use strict';

(function() {
  angular.module('app.passageiro')
    .controller('usuario.PassageiroCtrl', PassageiroCtrl);

  PassageiroCtrl.$inject = ['$scope', 'promiseTracker', '$log', '$state', '$injector', '$squel', '$localStorage', 'DBClient'];

  function PassageiroCtrl($scope, promiseTracker, $log, $state, $injector, $squel, $localStorage, DBClient) {
    var vm = this;
    vm.loadMoreData = loadMoreData;
    vm.save = save;
    vm.back = back;
    vm.isReadOnly = isReadOnly;
    vm.title = $localStorage.getReadOnlyPassageiros() ? 'Lista de Passageiros' : 'Lista de Presença';
    console.log(vm.title)

    var PassageiroService = $injector.get('PassageiroService');
    var firstRow = 0,
      ROWS = 9;
    vm.canLoad = true

    function loadMoreData() {

      return PassageiroService.list(firstRow, ROWS).then(function(data) {
        if (!vm.passageiros) {
          vm.passageiros = [];
        }
        if (data && data.length > 0 && vm.canLoad) {
          angular.forEach(data, function(passageiro) {
            if (!passageiro.changed) {
              passageiro.status = 2;
            }
            vm.passageiros.push(passageiro);
          });

          firstRow += ROWS;
        }

        vm.canLoad = !(data.length < ROWS);

        $scope.$broadcast('scroll.infiniteScrollComplete');
        $scope.$broadcast('scroll.refreshComplete');
      }, $log.error);

    }

    function back() {
      window.history.back();
    }

    function isReadOnly() {

      return $localStorage.getReadOnlyPassageiros();
    }

    function save(passageiro) {
      if (isReadOnly()) {
        passageiro.openDescription = !passageiro.openDescription;
        return;
      }
      if (passageiro.status === 1) {
        passageiro.status = 2;
      } else {
        passageiro.status = 1;
      }
      var sqlUpdate = $squel.update()
        .table('roteiroPassageiro')
        .set('status', passageiro.status)
        .set('changed', 'true')
        .set('codigoUsuarioRegistro', $localStorage.getUsuario().codigo)
        .where('codigo = ?', passageiro.codigo);
      return DBClient.query(sqlUpdate.toString());

    }
  }

})();
