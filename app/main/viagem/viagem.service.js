'use strict';

(function() {
  angular.module('app.viagem')
    .service('ViagemService', ViagemService);
  ViagemService.$inject = ['$localStorage', '$moment', '$q', '$squel', '$injector', '$log'];

  function ViagemService($localStorage, $moment, $q, $squel, $injector, $log) {
    var self = this;
    var viagemToEdit = null;
    var DBClient = $injector.get('DBClient');
    var MotoristaService = $injector.get('MotoristaService');
    var VeiculoService = $injector.get('VeiculoService');
    var StringBuilder = $injector.get('StringBuilder');
    self.toStorage = toStorage;
    self.fromStorage = fromStorage;
    self.list = list;
    self.insert = insert;
    self.toEdit = toEdit;
    self.getToEdit = getToEdit;
    self.update = update;
    self.save = save;
    self.getViagem = getViagem;
    self.remove = remove;
    self.createQueryListBuilder = createQueryListBuilder;
    self.exportData = exportData;
    self.exportDataPontos = exportDataPontos;
    self.updateRoteiroPassageiro = updateRoteiroPassageiro;
    self.exportDataPassageiro = exportDataPassageiro;
    self.listAllRoteiro = listAllRoteiro;
    self.listAllRoteiroPassageiro = listAllRoteiroPassageiro;

    function setStorage(viagem) {
      if (viagem.saida) {
        viagem.saida = viagem.saida.toString();
      }
      if (viagem.chegada) {
        viagem.chegada = viagem.chegada.toString();
      }

      $localStorage.setViagem(viagem);
    }

    function getStorage() {
      var viagem = $localStorage.getViagem();
      if (viagem.saida) {
        viagem.saida = $moment(viagem.saida);
      }
      if (viagem.chegada) {
        viagem.chegada = $moment(viagem.chegada);
      }

      return viagem;
    }


    function toStorage(viagem) {
      return $q.when(setStorage(viagem));
    }

    function fromStorage() {
      return $q.when(getStorage());
    }

    function createQueryListBuilder() {
      return new QueryListBuilder();
    }

    function exportData() {
      var sqlQuery =
        $squel.select().from('viagens', 'v')
        .field('v.codigo')
        .field('v.motorista')
        .field('v.usuario')
        .field('v.veiculo')
        .field('v.saida')
        .field('v.chegada')
        .field('v.destino')
        .field('v.nomeDestino')
        .field('v.localSaida')
        .field('v.kmInicial')
        .field('v.kmFinal')
        .field('v.observacao')
        .field('v.dataCadastro')
        .order('v.usuario')
        .toString();
      return DBClient
        .query(sqlQuery)
        .then(DBClient.fetchAll, $log.error);
    }


    function exportDataPontos() {
      var sqlQuery =
        $squel.select().from('viagens_pontos_trajeto', 'v')
        .field('v.codigo')
        .field('v.latitude')
        .field('v.longitude')
        .field('v.velocidade')
        .field('v.motorista')
        .field('v.usuario')
        .field('v.veiculo')
        .field('v.dataDoRegistro')
        .toString();
      return DBClient
        .query(sqlQuery)
        .then(DBClient.fetchAll, $log.error);
    }

    function exportDataPassageiro() {
      var sqlQuery = $squel.select().from('roteiroPassageiro')
        .field('codigo')
        .field('status')
        .field('codigoUsuario')
        .field('codigoUsuarioRegistro')
        .toString()
      return DBClient
        .query(sqlQuery)
        .then(DBClient.fetchAll, $log.error);
    }

    function list(veiculo, motorista, init, deep) {
      var sqlQuery =
        $squel.select().from('viagens', 'v')
        .field('v.codigo')
        .field('v.codigoRoteiro')
        .field('v.motorista')
        .field('v.nomeDestino')
        .field('v.localSaida')
        .field('v.usuario')
        .field('v.veiculo')
        .field('v.saida')
        .field('v.chegada')
        .field('v.destino')
        .field('v.kmInicial')
        .field('v.kmFinal')
        .field('v.observacao');
      if (veiculo) {
        sqlQuery.where('veiculo = ?', veiculo.codigo);
      }

      if (motorista) {
        sqlQuery.where('motorista = ?', motorista.codigo);
      }

      var applyLimit = function(sql) {
        if (!init || !deep || init < 0 || deep < 1) {
          return sql;
        }

        return sql.concat(' LIMIT ' + init + ', ' + deep);
      };
      return DBClient
        .query(applyLimit(sqlQuery.order('kmFinal', false).toString()))
        .then(function(data) {
          return DBClient.fetchAll(data);
        }, $log.error);
    }

    function insert(viagem) {
      var sqlInsert = $squel.insert()
        .into('viagens')
        .set('codigoRoteiro', viagem.codigoRoteiro || '')
        .set('chegada', viagem.chegada.toString())
        .set('destino', viagem.destino)
        .set('nomeDestino', viagem.nomeDestino)
        .set('localSaida', viagem.localSaida)
        .set('motorista', viagem.motorista.codigo)
        .set('usuario', viagem.motorista.usuario)
        .set('veiculo', viagem.veiculo.codigo)
        .set('saida', viagem.saida.toString())
        .set('kmInicial', viagem.kmInicial)
        .set('kmFinal', viagem.kmFinal)
        .set('observacao', viagem.observacao || '')
        .set('dataCadastro', $moment().toString())
        .set('keyword', createKeyWord(viagem));

      function addPontosTrageto(result) {
        var retornar = function() {
          return $q.when(result);
        };

        if (!$localStorage.getPontosGps() || !$localStorage.getPontosGps().pontos) {
          return retornar();
        }
        var pontos = $localStorage.getPontosGps().pontos;
        var sqlInsertAll = $squel
          .insert()
          .into('viagens_pontos_trajeto')
          .setFieldsRows(
            _.map(pontos, function(ponto) {
              return angular.merge({
                motorista: viagem.motorista.nome,
                usuario: viagem.motorista.usuario,
                veiculo: viagem.veiculo.descricao,
                codigoViagem: result.insertId,
                dataDoRegistro: $moment().toString()
              }, ponto);
            })
          )
          .toString();
        return DBClient.query(sqlInsertAll).then(retornar);
      }

      return DBClient.query(sqlInsert.toString()).then(addPontosTrageto);
    }


    function updateRoteiroPassageiro(item) {
      var sqlUpdate = $squel.update()
        .table('roteiroPassageiro')
        .set('status', item.status)
        .set('codigoUsuarioRegistro', $localStorage.getUsuario().codigo)
        .where('codigo = ?', item.codigo);
      return DBClient.query(sqlUpdate.toString());
    }

    function listAllRoteiro(motorista, veiculo, saida) {
      $log.log('Listando roteiro')
      var query = $squel.select().from('roteiroViagem')
        .field('codigo')
        .field('codigoVeiculo')
        .field('codigoMotorista')
        .field('saida')
        .field('chegada')
        .where('codigoMotorista = ?', motorista.codigo)
        .where('codigoVeiculo = ?', veiculo.codigo)
        //Caso venha até uma hora mais cedo até a data de chegada
        //Carrega os passageiros de acordo com o horário que o motorista
        //|niciou sua viagem
        .where('datetime(?) BETWEEN datetime(saida, \'-1 Hour\') AND datetime(chegada)', saida.toString());
      $log.log(query.toString());
      var applyLimit = function(sql) {
        return sql;
      };

      return DBClient.query(
        applyLimit(
          query
          .order('codigo')
          .toString()
        )
      ).then(DBClient.fetchAll, $log.error);
    }

    function listAllRoteiroPassageiro(codigoRoteiro) {
      $log.log('Listando roteiro passageiro')
      var query = $squel.select().from('roteiroPassageiro')
        .field('codigo')
        .field('codigoRoteiro')
        .field('codigoUsuario')
        .field('destino')
        .field('observacao')
        .field('horario')
        .field('codigoUsuarioFalta')
        .field('localEmbarque')
        .field('tpViagem')
        .field('codigoSolicitacao')
        .field('status')
        .field('nomeUsuario')
        .field('descricaoStatus')
        .where('codigoRoteiro = ?', codigoRoteiro)
      var applyLimit = function(sql) {
        return sql;
      };

      return DBClient.query(
        applyLimit(
          query
          .order('codigo')
          .toString()
        )
      ).then(DBClient.fetchAll, $log.error);
    }

    function update(viagem) {
      var sqlUpdate = $squel.update()
        .table('viagens')
        .set('chegada', viagem.chegada.toString())
        .set('codigoRoteiro', viagem.codigoRoteiro || '')
        .set('destino', viagem.destino)
        .set('nomeDestino', viagem.nomeDestino)
        .set('localSaida', viagem.localSaida || '')
        .set('motorista', viagem.motorista.codigo)
        .set('usuario', viagem.motorista.usuario)
        .set('veiculo', viagem.veiculo.codigo)
        .set('saida', viagem.saida.toString())
        .set('kmInicial', viagem.kmInicial)
        .set('kmFinal', viagem.kmFinal)
        .set('observacao', viagem.observacao || '')
        .set('dataCadastro', $moment().toString())
        .set('keyword', createKeyWord(viagem))
        .where('codigo = ?', viagem.codigo);
        console.log(sqlUpdate.toString())
      return DBClient.query(sqlUpdate.toString());
    }

    function createKeyWord(viagem) {
      return StringBuilder
        .create()
        .append(viagem.motorista.nome)
        .space()
        .append(viagem.veiculo.descricao)
        .space()
        .append(viagem.destino)
        .space()
        .append(viagem.nomeDestino)
        .toString();
    }

    function toEdit(viagem) {
      viagemToEdit = viagem;
      if(viagemToEdit){
        $localStorage.setViagemToEdit(viagemToEdit);
      }
    }

    function save(viagem) {
      return viagem.codigo ? update(viagem) : insert(viagem);
    }

    function getViagem(codigo, index) {
      var query =
        $squel.select()
        .from('viagens', 'v')
        .field('v.motorista')
        .field('v.codigoRoteiro')
        .field('v.veiculo')
        .field('v.usuario')
        .field('v.saida')
        .field('v.chegada')
        .field('v.nomeDestino')
        .field('v.kmInicial')
        .field('v.kmFinal')
        .field('v.observacao')
        .field('v.codigoRoteiro')
        .where('v.codigo = ?', codigo);
      return DBClient.query(query.toString())
        .then(function(data) {
          var viagem = DBClient.fetch(data);
          if (!viagem) {
            return;
          }
          var result;
          MotoristaService.get(viagem.motorista).then(function(data) {
            if (!viagem.motorista && data) {
              viagem.motorista = data;
            }
          }), VeiculoService.getVeiculo(viagem.veiculo).then(function(data) {
            if (!viagem.veiculo && data) {
              viagem.veiculo = data;
            }
            if (index) {
              viagem.index = index;
            }
            result = viagem;

          });
          return $q.when(result);
        });
    }

    function remove(codigo) {
      var sqlDelete =
        $squel.delete()
        .from('viagens')
        .where('codigo = ?', codigo);

      function removePontosTrajeto(result) {
        return DBClient.query(
            $squel.delete()
            .from('viagens_pontos_trajeto')
            .where('codigoViagem = ?', codigo)
            .toString())
          .then(function() {
            return $q.when(result);
          }, $log.error);
      }

      return DBClient.query(sqlDelete.toString()).then(removePontosTrajeto);
    }

    function getToEdit() {
      var viagem = angular.copy($localStorage.getViagemToEdit());
      if (viagem) {
        viagem.saida = $moment(viagem.saida);
        viagem.chegada = $moment(viagem.chegada);
      }

      viagemToEdit = null;
      return $q.when(viagem);
    }

    return self;

    function QueryListBuilder() {
      var self = this;
      var args = {};
      args.filter = {};
      self.motorista = motorista;
      self.veiculo = veiculo;
      self.linhaInicio = linhaInicio;
      self.rangeQuery = rangeQuery;
      self.filter = filter;
      self.getFunctionQuery = getFunctionQuery;
      self.build = build;

      function motorista(toSet) {
        args.motorista = toSet;
        return self;
      }

      function veiculo(toSet) {
        args.veiculo = toSet;
        return self;
      }

      function linhaInicio(toSet) {
        args.linhaInicio = toSet;
        return self;
      }

      function rangeQuery(toSet) {
        args.rangeQuery = toSet;
        return self;
      }

      function filter(toSet) {
        angular.extend(args.filter, toSet);
        return self;
      }

      function getFunctionQuery() {
        return build;
      }

      function build() {
        var sqlQuery =
          $squel.select().from('viagens', 'v')
          .field('v.codigo')
          .field('v.motorista')
          .field('v.codigoRoteiro')
          .field('v.veiculo')
          .field('v.usuario')
          .field('v.saida')
          .field('v.nomeDestino')
          .field('v.localSaida')
          .field('v.chegada')
          .field('v.destino')
          .field('v.kmInicial')
          .field('v.kmFinal')
          .field('v.observacao');
        if (args.veiculo) {
          sqlQuery.where('veiculo = ?', args.veiculo.codigo);
        }

        if (args.motorista) {
          sqlQuery.where('motorista = ?', args.motorista.codigo);
        }

        if (args.filter) {
          angular.forEach(args.filter, function(value, sql) {
            value ?
              sqlQuery.where(sql, value) :
              sqlQuery.where(sql);
          });
        }

        var applyLimit = function(sql) {
          if (args.linhaInicio < 0 || args.rangeQuery < 1) {
            return sql;
          }

          return sql.concat(' LIMIT ' + args.linhaInicio + ', ' + args.rangeQuery);
        };
        $log.log(applyLimit(sqlQuery.order('kmFinal', false).toString()));
        return DBClient
          .query(applyLimit(sqlQuery.order('kmFinal', false).toString()))
          .then(function(data) {
            return DBClient.fetchAll(data);
          }, $log.error);
      }

    }
  }
})();
