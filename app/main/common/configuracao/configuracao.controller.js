'use strict';

(function () {
  angular.module('app.common')
  .controller('common.ConfiguracaoCtrl', ConfiguracaoCtrl);

  ConfiguracaoCtrl.$inject = ['ParametrosApp', '$state', 'DBClient', 'Database', 'popup', '$localStorage'];

  function ConfiguracaoCtrl(ParametrosApp, $state, DBClient, Database, popup, $localStorage) {
    var vm = this;

    vm.save = save;
    vm.deleteDB = deleteDB;

    vm.configuracao = {};
    vm.configuracao.timeSession = ParametrosApp.getTimeSession().getMinutes();
    vm.configuracao.usuario = window.localStorage.usuario === 'undefined' ? '': window.localStorage.usuario;
    vm.configuracao.url = window.localStorage.url === 'undefined' ? '': window.localStorage.url;
    vm.configuracao.senha = window.localStorage.senha === 'undefined'? '': window.localStorage.senha;

    function save(){
      ParametrosApp.getTimeSession().setMinutes(vm.configuracao.timeSession);
      window.localStorage.url = vm.configuracao.url;
      window.localStorage.usuario = vm.configuracao.usuario;
      window.localStorage.senha = vm.configuracao.senha;
      popup.info('Configurações salvas com sucesso!').then(function(){
        var databaseCreated = $localStorage.getDatabaseCreated() && $localStorage.getDatabaseCreated().created;
        if(databaseCreated){
          $state.goNoHistory('app.inicio');
        }else{
          $state.goNoHistory('app.sincronizar');
        }

      });
    }

    function deleteDB(){
      DBClient.deleteDB(Database.nameDatabase);
      popup.info('Database deletado com sucesso!');
    }
  }

})();
