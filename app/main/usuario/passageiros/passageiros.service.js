'use strict';

(function() {
  angular.module('app.passageiro')
    .service('PassageiroService', PassageiroService);
PassageiroService.$inject = ['$localStorage', '$moment', '$q', '$squel', '$injector', '$log', 'DBClient'];

  function PassageiroService($localStorage, $moment, $q, $squel, $injector, $log, DBClient) {
    var self = this;
    self.list = list;

    function list(init, deep, codigoRoteiro) {
      var sqlQuery =
        $squel.select().from('roteiroPassageiro', 'r')
        .field('r.codigo')
        .field('r.nomeUsuario')
        .field('r.destino')
        .field('r.localEmbarque') //local embarque
        .field('r.observacao')
        .field('r.tpViagem')
        .field('r.status')
        .field('r.changed')
        .field('r.telefone')
        .field('r.horario')

      var applyLimit = function(sql) {
        if (!init || !deep || init < 0 || deep < 1) {
          return sql;
        }

        return sql.concat(' LIMIT ' + init + ', ' + deep);
      };
      var sql;
      if(!codigoRoteiro){
        sql = sqlQuery.where('r.codigoRoteiro = ' + ($localStorage.getRoteiro() ? $localStorage.getRoteiro().codigoRoteiro : 0));
      }else{
        sql = sqlQuery.where('r.codigoRoteiro = ' + codigoRoteiro);
      }
      return DBClient
        .query(applyLimit(sql).order('r.nomeUsuario', true).toString())
        .then(function(data) {
          return DBClient.fetchAll(data);
        }, $log.error);
    }

    return self;
  }
})();
