'use strict';

(function() {
  angular.module('app.sincronizacao')
    .factory('IntegracaoService', IntegracaoService);

  IntegracaoService.$inject = ['Restangular', '$jsSHA', '$q', 'DBClient', '$squel', '$injector', '$rootScope', '$log'];

  function IntegracaoService(Restangular, $jsSHA, $q, DBClient, $squel, $injector, $rootScope, $log) {
    var self = this;
    var dadosCadastrais = {};
    var VERSION = '1.0';
    var baseUrl;

    var ViagemService = $injector.get('ViagemService');
    var TABLES = $injector.get('Tables');


    self.importarDadosCadastrais = importarDadosCadastrais;
    self.enviarViagens = enviarViagens;
    self.enviarPontosViagens = enviarPontosViagens;
    self.enviarPassageiros = enviarPassageiros;
    self.limparDadosCadastrais = limparDadosCadastrais;
    self.limparViagens = limparViagens;
    self.limparRotas = limparRotas;
    self.buscarDadosCadastrais = buscarDadosCadastrais;

    self.setBaseUrl = setBaseUrl;

    self.validateUser = validateUser;

    self.getVeiculos = getVeiculos;

    self.getRoteiroViagem = getRoteiroViagem;
    self.getRoteiroPassageiro = getRoteiroPassageiro;

    self.getCidades = getCidades;

    Restangular.addFullRequestInterceptor(
      function interceptor(element, operation, route, url, headers) {
        var self = {};

        self.headers = headers;

        self.headers.id = 'fajk45hlf098lkdkjh598823hjkvmn6poux7';
        self.headers.data = new Date().getTime();
        self.headers.hash = $jsSHA.criptografar(self.headers.id + self.headers.data + 'iafhj454353498kl124j08kjdh5622km168g');

        return self;
      }
    );

    function setBaseUrl(url) {
      if (url.substring(0, 4) !== 'http') {
        url = 'https://' + url;
      }

      if (url.substring(url.length - 1) !== '/') {
        url += '/';
      }

      url += 'rest/frotamobile';

      baseUrl = url;

      $log.log(baseUrl);
    }

    function enviarViagens() {
      return ViagemService.exportData().then(function(data) {
        if (angular.isArray(data) && data.length > 0) {
          return getVersion().all('viagens').post(data);
        }

        return $q.when([]);
      });
    }

    function enviarPassageiros() {
      return ViagemService.exportDataPassageiro().then(function(data) {
        if (angular.isArray(data) && data.length > 0) {
          return getVersion().all('roteiro-passageiro').post(data);
        }
        return $q.when([]);
      });
    }

    function enviarPontosViagens() {
      return ViagemService.exportDataPontos().then(function(data) {
        if (angular.isArray(data) && data.length > 0) {
          return getVersion().all('viagensPontos').post(data);
        }

        return $q.when([]);
      });
    }

    function sendMessage(message) {
      $rootScope.$broadcast('ADD::LOG::SINCRONIZACAO', {
        mensagem: message
      });
    }

    function importarDadosCadastrais() {
      return $q.all([
        importDataToTable('veiculos', dadosCadastrais.veiculos, 'Veiculos importados com sucesso.', 'Veiculos'),
        importDataToTable('motoristas', dadosCadastrais.motoristas, 'Motoristas importados com sucesso.', 'Motoristas'),
        importDataToTable('usuarios', dadosCadastrais.usuarios, 'Usuários importados com sucesso.', 'Usuários'),
        importDataToTable('roteiroViagem', dadosCadastrais.roteiroViagem, 'Roteiros importados com sucesso.', 'Roteiro de Viagem'),
        importDataToTable('roteiroPassageiro', dadosCadastrais.roteiroPassageiro, 'Passageiros dos roteiros importados com sucesso.', 'Passageiros'),
        importDataToTable('cidade', dadosCadastrais.cidade, 'Cidades importadas com sucesso.', 'Cidades')
      ]);
    }

    function buscarDadosCadastrais() {
      return $q.all([
        getVeiculos(),
        getMotoristas(),
        getUsuarios(),
        getRoteiroViagem(),
        getRoteiroPassageiro(),
        getCidades()
      ]);
    }

    function getVersion() {
      if (!baseUrl) {
        throw Error('url inválida!');
      }

      return Restangular.oneUrl('customUrl', baseUrl).one(VERSION);
    }

    function validateUser(user) {
      return getVersion().all('validate-user').post(user);
    }

    function getRoteiroViagem() {
      return getVersion().all('roteiro-viagem').getList()
        .then(function(data) {
          dadosCadastrais.roteiroViagem = data;
          sendMessage('Roteiros carregados com sucesso.');
        });
    }

    function getCidades() {
      return getVersion().all('cidade').getList()
        .then(function(data) {
          dadosCadastrais.cidade = data;
          sendMessage('Cidades carregadas com sucesso.');
        });
    }

    function getRoteiroPassageiro() {
      return getVersion().all('roteiro-passageiro').getList()
        .then(function(data) {
          dadosCadastrais.roteiroPassageiro = data;
          sendMessage('Passageiros dos roteiros carregados com sucesso.');
        });
    }

    function getVeiculos() {
      return getVersion().all('veiculos').getList()
        .then(function(data) {
          dadosCadastrais.veiculos = data;
          sendMessage('Veiculos carregados com sucesso.');
        });
    }

    function getMotoristas() {
      return getVersion().all('motoristas').getList()
        .then(function(data) {
          dadosCadastrais.motoristas = data;
          sendMessage('Motoristas carregados com sucesso.');
        });
    }

    function getUsuarios() {
      return getVersion().all('usuarios').getList()
        .then(function(data) {
          dadosCadastrais.usuarios = data;
          sendMessage('Usuários carregados com sucesso.');
        });
    }

    function limparDadosCadastrais() {
      return $q.all([
        clearTable('motoristas'),
        clearTable('usuarios'),
        clearTable('veiculos'),
        clearTable('roteiroViagem'),
        clearTable('roteiroPassageiro'),
        clearTable('cidade')
      ]);
    }

    function limparViagens() {
      return clearTable('viagens');
    }


    function limparRotas() {
      return clearTable('viagens_pontos_trajeto');
    }

    function clearTable(table) {
      return DBClient.query($squel.delete().from(table).toString());
    }

    function importDataToTable(table, data, message, id) {
    return DBClient.query(
        $squel
        .insert()
        .into(table)
        .setFieldsRows(
          _.map(data, function(row) {
            return _.pick(row, _.keys(TABLES.COLS[table]));
          }))
        .toString()
      ).then(function() {
          sendMessage(message);
        },
        function(e) {
          console.log(e)
          if (data.length === 0) {
            return $q.reject('Dados de ' + id + ' não encontrados, por favor verifique e tente novamente.');
          }
        });
    }

    return self;
  }

})();
