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

'use strict';

(function () {
    angular.module('main')
        .factory('InitConfigService', InitConfigService);

    InitConfigService.$inject = [];

    function InitConfigService() {
        var self = this;
        var initConfig = {};

        self.setConfigInitApp = setConfigInitApp;
        self.getInitConfig = getInitConfig;

        function setConfigInitApp(config){
          initConfig = config;
        }

        function getInitConfig(){
          return angular.copy(initConfig);
        }

        return self;
    }

})();

'use strict';

(function () {
  angular.module('main')
    .controller('main.InicioCtrl', InicioCtrl);

  InicioCtrl.$inject = ['$state', '$scope', '$injector', '$moment', '$timeout', '$http', '$ionicLoading' , '$cordovaFile', '$cordovaFileOpener2'];

  function InicioCtrl($state, $scope, $injector, $moment, $timeout, $http, $ionicLoading, $cordovaFile, $cordovaFileOpener2) {
    var vm = this;
    var LOGIN_STATE = 'app.usuario';
    var InitConfigService = $injector.get('InitConfigService');
    var popup = $injector.get('popup');
    var LoginEventEmitter = $injector.get('LoginEventEmitter');
    var $localStorage = $injector.get('$localStorage');
    var RoteiroService = $injector.get('RoteiroService');
    RoteiroService.setNextState('app.novaviagem');
    RoteiroService.setLabel('Nova Viagem!');

    //Apenas enquanto não for liberado para o cliente
    var LIBERAR_PROCEDIMENTO_ATUALIZACAO = false;

    var DELAY = 1000;

    var databaseCreated = $localStorage.getDatabaseCreated() && $localStorage.getDatabaseCreated().created;

    if(LIBERAR_PROCEDIMENTO_ATUALIZACAO){
      verificarAtualizacao();
    }

    $scope.$on('DB:OK', function(event, ok){
      if(ok){
        init();
      }
    });

    vm.estadosViagem = $localStorage.getEstadoViagem();

    if(!vm.estadosViagem){
      vm.estadosViagem = {
        viajando: false,
        encerrando: false,
        novaViagem: true
      };
    }

    vm.user = $localStorage.getUsuario();
    vm.veiculo = $localStorage.getVeiculo();

    if(!databaseCreated){
      $state.goNoHistory('app.configuracao');
      return;
    }

    if(!$localStorage.getUsuario() || !$localStorage.getVeiculo()){
      $state.goNoHistory(LOGIN_STATE);
    }

    if(InitConfigService.getInitConfig() && InitConfigService.getInitConfig().sincronized){
      if(!databaseCreated){
        $state.goNoHistory('app.configuracao');
        return;
      }

      init();
    }

    function init(){
      LoginEventEmitter.onBeginApp().then(function(valid){
        if(!databaseCreated){
          $state.goNoHistory('app.configuracao');
          return;
        }

        if (!valid) {
          $state.goNoHistory(LOGIN_STATE);
        }
      });
    }

    function refreshClock(){
      vm.time = $moment();
      $timeout(refreshClock, DELAY);
    }

    $timeout(refreshClock, DELAY);


    function verificarAtualizacao(){
      $http.get('versao.txt').success(function (versaoLocal) {
        var url = 'https://s3-sa-east-1.amazonaws.com/celk/storage/aplicativos/versao.txt?'+ new Date().getTime();
        console.log('URL REMOTA: ' + url);

        $http.get(url).success(function (versaoRemota) {
          console.log('VERSAO REMOTA: ' + versaoRemota);
          if (!_.isNaN(versaoRemota) && !_.isNaN(versaoLocal) && Number(versaoRemota) > Number(versaoLocal)) {
            popup.confirmation('Existe uma nova versão disponível que pode corrigir problemas no aplicativo. Deseja atualizar agora?').then(function (res) {
              if (res) {
                $scope.bind.loading = 'Carregando...';

                $ionicLoading.show({
                  template: '{{bind.loading}}',
                  scope: $scope
                });

                $cordovaFile.downloadFile('https://s3-sa-east-1.amazonaws.com/celk/storage/aplicativos/mobilefrota.apk',
                  'cdvfile://localhost/persistent/celk/mobilefrota/mobilefrota.apk').then(function () {

                  $cordovaFileOpener2.open(
                    'cdvfile://localhost/persistent/celk/mobilefrota/mobilefrota.apk',
                    'application/vnd.android.package-archive'
                  );

                  $ionicLoading.hide();

                }, function () {
                  $ionicLoading.hide();
                  popup.info('Não foi possível atualizar, verifique se você está conectado na internet e tente novamente.');
                }, function (progress) {
                  if (progress.lengthComputable) {
                    var perc = Math.floor(progress.loaded / progress.total * 100);
                    $scope.bind.loading = 'Carregando... ' + perc + '%';
                  } else {
                    $scope.bind.loading = 'Carregando... ';
                  }
                });
              }
            });
          }
        });
      });
    }

  }

})();

'use strict';

(function () {
    angular.module('app.viagem', ['app.passageiro']);
})();

'use strict';

(function () {
    angular.module('app.viagem')
        .controller('viagem.ViagensEncerradasCtrl', ViagensEncerradasCtrl);

    ViagensEncerradasCtrl.$inject = ['$scope','promiseTracker', '$log', '$state', '$injector', '$localStorage', '$q', '$ionicUtils', '$moment'];

    function ViagensEncerradasCtrl($scope,promiseTracker, $log, $state, $injector,$localStorage, $q, $ionicUtils, $moment) {
        var vm = this, mainEvent;

        var ViagemService = $injector.get('ViagemService');
        var popup = $injector.get('popup');
        var firstRow = 0, ROWS = 9;
        var StringBuilder = $injector.get('StringBuilder');
        var $dateTimePicker = $injector.get('$dateTimePicker');
        vm.estadosViagem = $localStorage.getEstadoViagem();
        vm.canLoad = true;
        $localStorage.setRoteiro(null);


        vm.tracker = {};
        vm.tracker.loading = promiseTracker();
        vm.tracker.deleting = promiseTracker();

        //functions to bind
        vm.toDelete = toDelete;
        vm.edit = edit;
        vm.novaViagem = novaViagem;
        vm.deleteViagem = deleteViagem;
        vm.loadMoreData = loadMoreData;
        vm.search = search;
        vm.clear = clear;
        vm.changeDate = changeDate;

        init();

        function init(){
          vm.motorista = $localStorage.getUsuario();
          vm.veiculo = $localStorage.getVeiculo();
          $localStorage.setViagemToEdit(null);
        }

        function toDelete(item){
          var deleting = function (){
            item.toDelete = !item.toDelete;
          };

          vm.tracker.deleting.addPromise($q.when(deleting()));
        }

        function edit(item){
          $log.log(item);
          ViagemService.toEdit(item);
          $state.go('app.cad-viagem');
        }

        function novaViagem(){
          $state.go('app.cad-viagem');
        }

        function deleteViagem(viagem){
          vm.tracker.deleting.addPromise(
            ViagemService.remove(viagem.codigo)
              .then(function(){
                   vm.viagens.splice(vm.viagens.indexOf(viagem), 1);
               popup.info('Viagem removida com sucesso!');

               $state.reload($state.current);
          }));
        }

        function getFilter(){
          var filter = {};
          if(vm.busca){
            filter['keyword LIKE ?'] = '%'+vm.busca+'%';
          }

          if(vm.buscaSaida){
            var like = StringBuilder.create()
              .append('strftime("%Y-%m-%d", saida)')
              .append(' = ')
              .append('strftime("%Y-%m-%d", "')
              .append($moment(vm.buscaSaida).toString())
              .append('")')
              .toString();

            filter[like] = null;

          }

          return filter;
        }

        function clear(model){
          vm[model] = null;
          search({type:mainEvent});
        }

        function search(event){
          if(!mainEvent){
            mainEvent = event.type;
          }

          if(angular.isString(mainEvent) && angular.isString(event.type) && mainEvent.toLowerCase() === event.type.toLowerCase()){
            vm.canLoad = true;
            vm.viagens = [];
            firstRow = 0;
            $ionicUtils.toTop();
            loadMoreData();
          }

        }

        function loadMoreData(){
          var filter = getFilter();

          return ViagemService.createQueryListBuilder()
            // .motorista(vm.motorista)
            // .veiculo(vm.veiculo)
            .linhaInicio(firstRow)
            .rangeQuery(ROWS)
            .filter(filter)
            .build()
            .then(function(data){

              if(!angular.isArray(vm.viagens)){
                vm.viagens = [];
              }

              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(viagem){
                  vm.viagens.push(viagem);
                });

                firstRow += ROWS;
              }

              vm.canLoad =!(data.length < ROWS);

              $scope.$broadcast('scroll.infiniteScrollComplete');
              $scope.$broadcast('scroll.refreshComplete');
            }, $log.error);

        }

        function changeDate(){
          $dateTimePicker.openDate(vm.buscaSaida).then(function(data){
            vm.buscaSaida = data;
            $scope.$applyAsync();
          });
        }

    }

})();

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

'use strict';

(function () {
    angular.module('app.viagem')
        .controller('viagem.ViajandoCtrl', ViajandoCtrl);

    ViajandoCtrl.$inject = [ 'LoginEventEmitter', '$state', '$injector', '$scope', '$dateTimePicker', '$localStorage', '$moment', '$ionicPopup'];

    function ViajandoCtrl( LoginEventEmitter,$state, $injector, $scope, $dateTimePicker, $localStorage, $moment, $ionicPopup) {
      var vm = this;

      var ViagemService = $injector.get('ViagemService');
      var MotoristaService = $injector.get('MotoristaService');
      var VeiculoService = $injector.get('VeiculoService');
      var RoteiroService = $injector.get('RoteiroService');
      vm.encerrar = encerrar;
      vm.goSelectMotorista = MotoristaService.changeSelection;
      vm.goSelectVeiculo = VeiculoService.changeSelection;
      vm.refreshSaida = refreshSaida;
      vm.saidaListener = saidaListener;
      init();
      function init(){
        ViagemService.fromStorage().then(function(data){
          vm.viagem = data;
          vm.viagem.motorista = $localStorage.getUsuario();
          vm.viagem.veiculo = $localStorage.getVeiculo();
          vm.viagem.saida = $localStorage.getDataSaida();
          if(vm.viagem.codigoRoteiro){
            RoteiroService.getRoteiro(vm.viagem.codigoRoteiro).then(function(result){
              $localStorage.setRoteiro(result[0]);
            })
          }
          startTempoViagem();
          $scope.$emit('CAPTAR::PONTOS');
        });
        if($localStorage.getRoteiro()){
          $localStorage.setRoteiroM($localStorage.getRoteiro());
        }else if($localStorage.getRoteiroM()){
            $localStorage.setRoteiro($localStorage.getRoteiroM());
          }

      }

      function encerrar(){

        if(vm.disabilitar){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A saída não pode ser maior do que a data atual.'
         });
         return;
        }

        var eventAfterValidate = function(){
          ViagemService.toStorage(vm.viagem)
            .then(function(){
              $scope.$emit('ESTADO::VIAGEM', { encerrando: true });
              $state.go('app.encerrando-viagem');
            });
        };

        LoginEventEmitter.onSave(eventAfterValidate).then(function(valid){
          if(valid) {
            eventAfterValidate();
          }
        });
      }

      function startTempoViagem(){
        vm.initTempoViagem = vm.viagem.saida.valueOf();
      }

      function refreshSaida(){
        var timer = _.first($('.timer-card').find('timer'));

        if(timer){
          timer.stop();
          startTempoViagem();
          timer.start();
        }
      }

      function saidaListener(data){
          $localStorage.setDataSaida(data);
          if($moment().isBefore($localStorage.getDataSaida())){
            $ionicPopup.alert({
             title: 'Atenção',
             template: 'A saída não pode ser maior do que a data atual.'
           });
           $localStorage.setDataChegada(data);
           vm.disabilitar = true;
         }else{
           vm.disabilitar = false;
         }
          vm.viagem.saida = $localStorage.getDataSaida();
          refreshSaida();

      }

     }

})();

'use strict';

(function() {
  angular.module('app.viagem')
    .controller('viagem.NovaViagemCtrl', NovaViagemCtrl);

  NovaViagemCtrl.$inject = ['$localStorage', '$injector', '$state', '$moment', '$scope', '$dateTimePicker', '$rootScope', '$ionicPopup'];

  function NovaViagemCtrl($localStorage, $injector, $state, $moment, $scope, $dateTimePicker, $rootScope, $ionicPopup) {
    var vm = this;
    var LoginEventEmitter = $injector.get('LoginEventEmitter');
    var ViagemService = $injector.get('ViagemService');
    var MotoristaService = $injector.get('MotoristaService');
    var VeiculoService = $injector.get('VeiculoService');
    var RoteiroService = $injector.get('RoteiroService');
    RoteiroService.setLabel('Nova Viagem!');

    var EstadoViagem = $localStorage.getEstadoViagem();

    vm.viagem = {};

    init();

    function init() {
      $rootScope.listPassageiros = undefined;
      vm.viagem.motorista = $localStorage.getUsuario();
      vm.viagem.veiculo = $localStorage.getVeiculo();
      vm.saidaListener = saidaListener;
      vm.initKm = initKm;
      var localRoteiro = $localStorage.getRoteiro();
      if(localRoteiro){
        var cidadeToStorage = {}
        cidadeToStorage.codigo = localRoteiro.codigoCidade;
        cidadeToStorage.descricao = localRoteiro.destino;
        $localStorage.setCidade(cidadeToStorage)
        vm.viagem.codigoRoteiro = localRoteiro.codigoRoteiro;
        vm.viagem.localSaida = localRoteiro.localSaida;
        vm.viagem.saida = $localStorage.getDataSaida() || $moment();
      }else{
        vm.viagem.saida = $moment();
        vm.viagem.chegada = $moment();
        $localStorage.setDataSaida(vm.viagem.saida);
        $localStorage.setDataChegada(vm.viagem.chegada)
      }
      vm.viagem.destino = $localStorage.getCidade();

      if (EstadoViagem.novaViagem) {
        ViagemService.list(vm.viagem.veiculo)
          .then(function(data) {
            var viagem = _.first(data);

            if (viagem) {
              if(vm.viagem.kmFinal || vm.viagem.veiculo.km === null){
                vm.viagem.veiculo.km = vm.viagem.kmFinal;
              }
            }

          });
      } else {
        vm.viagem = $localStorage.getViagem();
      }
    }

    vm.iniciaViagem = iniciaViagem;
    vm.goSelectMotorista = MotoristaService.changeSelection;
    vm.goSelectVeiculo = VeiculoService.changeSelection;
    vm.goCidade = goCidade;

    function goCidade() {
      $state.go('app.cidade');
    }
    function initKm(){
      vm.viagem.kmInicial = vm.viagem.veiculo.km ;
      $localStorage.setVeiculo(vm.viagem.veiculo);
      VeiculoService.update(vm.viagem.veiculo);
    }
    function iniciaViagem() {
      vm.form.$setSubmitted(true);
      if($localStorage.getRoteiro()){
        vm.viagem.codigoRoteiro = $localStorage.getRoteiro().codigoRoteiro
      }

      var eventAfterValidate = function() {
        ViagemService.toStorage(vm.viagem)
          .then(function() {
            $scope.$emit('ESTADO::VIAGEM', {
              viajando: true
            });
            $state.goNoHistory('app.viajando');

          });
      };

      if (vm.form.$valid) {
        LoginEventEmitter.onSave(eventAfterValidate).then(function(valid) {
          if (valid) {
            ViagemService.toStorage(vm.viagem)
              .then(eventAfterValidate);
          }
        });
      }
    }

    function saidaListener(data){
        $localStorage.setDataSaida(data);
        if($moment().isBefore($localStorage.getDataSaida())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A saída não pode ser maior do que a data atual.'
         });
          $localStorage.setDataSaida($moment());
        }
        vm.viagem.saida = $localStorage.getDataSaida();

    }

  }

})();

'use strict';

(function () {
  angular.module('app.viagem')
  .controller('viagem.EncerrarViagemCtrl', EncerrarViagemCtrl);

  EncerrarViagemCtrl.$inject = ['$injector', '$state', '$moment', 'popup', '$scope', '$dateTimePicker', '$localStorage', '$ionicPopup'];

  function EncerrarViagemCtrl($injector, $state, $moment, popup, $scope, $dateTimePicker, $localStorage, $ionicPopup) {
    var vm = this;

    var LoginEventEmitter = $injector.get('LoginEventEmitter');
    var ViagemService = $injector.get('ViagemService');
    var MotoristaService = $injector.get('MotoristaService');
    var VeiculoService = $injector.get('VeiculoService');

    init();

    function init() {
      ViagemService.fromStorage().then(function (data) {
        vm.viagem = data;
        $localStorage.setDataChegada($moment());
        vm.viagem.motorista = $localStorage.getUsuario();
        vm.viagem.veiculo = $localStorage.getVeiculo();

        vm.viagem.chegada = $localStorage.getDataChegada();
        vm.viagem.saida = $localStorage.getDataSaida();
        vm.saidaListener = saidaListener;
        vm.chegadaListener = chegadaListener;
      });
    }

    //public methods
    vm.finalizarEncerramento = finalizarEncerramento;
    vm.goSelectMotorista = MotoristaService.changeSelection;
    vm.goSelectVeiculo = VeiculoService.changeSelection;
    vm.focus = focus;


    function finalizarEncerramento() {

      vm.form.$setSubmitted(true);

      $scope.$emit('PARAR::CAPTAR::PONTOS');

      save();
    }

    function save() {
      var eventAfterValidate = function () {
        if ($localStorage.getPontosGps()) {
          vm.viagem.pontosTrajeto = $localStorage.getPontosGps().pontos;
        }
        if (vm.viagem.kmInicial >= vm.viagem.kmFinal) {
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'O KM Inicial não pode ser maior que o KM Final'
          });
          return;
        }
        // console.log(vm.viagem);
        var destino = vm.viagem.destino;
        vm.viagem.destino =  destino.codigo;
        vm.viagem.nomeDestino = destino.descricao;

        ViagemService.insert(vm.viagem)
        .then(function (result) {
          if (result && result.insertId) {
            vm.viagem.codigo = result.insertId;
          }
          vm.viagem.veiculo.km = vm.viagem.kmFinal;
          $localStorage.setVeiculo(vm.viagem.veiculo);
          VeiculoService.update(vm.viagem.veiculo);

          $localStorage.setPontosGps({
            isRunning: false
          });

          popup.info('Viagem Finalizada!').then(function () {
            $scope.$emit('ESTADO::VIAGEM', {novaViagem: true});
            $localStorage.setRoteiroM(null)
            $state.goNoHistory('app.inicio');
          });
        });
      };

      if (vm.form.$valid) {
        LoginEventEmitter.onSave(eventAfterValidate).then(function (valid) {
          if (valid) {
            eventAfterValidate();
          }
        });
      }
    }

    function saidaListener(data){
        $localStorage.setDataSaida(data);
        if($moment().isBefore($localStorage.getDataSaida())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A saída não pode ser maior do que a data atual.'
         });
          $localStorage.setDataSaida($moment());
        }
        vm.viagem.saida = $localStorage.getDataSaida();

    }

    function chegadaListener(data){
        $localStorage.setDataChegada(data);
        if($localStorage.getDataSaida().isAfter($localStorage.getDataChegada())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A chegada não pode ser menor do que a saída.'
         });
          $localStorage.setDataChegada($moment());
        }

        if(moment().isBefore($localStorage.getDataChegada())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A chegada não pode ser maior que a data atual.'
         });
         $localStorage.setDataChegada($moment());
       }
        vm.viagem.chegada = $localStorage.getDataChegada();

    }
    // HACK:

    function focus(id, event) {
      event.stopPropagation();
      $('#' + id).focus();
    }

    $scope.$watch('vm.viagem.kmFinal', function (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (!newValue || !vm.viagem.kmInicial || vm.viagem.kmInicial > newValue) {
          vm.distanciaPercorrida = null;
        } else {
          vm.distanciaPercorrida = vm.viagem.kmFinal - vm.viagem.kmInicial;

        }
      }
    });

    $scope.$watch('vm.viagem.kmInicial', function (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (!newValue || !vm.viagem.kmFinal || newValue > vm.viagem.kmFinal) {
          vm.distanciaPercorrida = null;
        } else {
          vm.distanciaPercorrida = vm.viagem.kmFinal - vm.viagem.kmInicial;
        }
      }
    });
  }

})();

'use strict';

(function () {
    angular.module('app.viagem')
        .directive('inputKmInicial', inputKmInicial)
      .controller('InputKmInicialCtrl', InputKmInicialCtrl);

    inputKmInicial.$inject = [];

    function inputKmInicial() {
        var dc = {};

        dc.templateUrl = 'main/viagem/directives/km-inicial.template.html';

        dc.require = 'ngModel';

        dc.scope = {};
        dc.scope.kmFinal = '=';
        dc.scope.ngModel = '=';
        dc.scope.kmForm = '=';
        dc.scope.ngChange = '=';

        dc.controller = 'InputKmInicialCtrl';
        dc.controllerAs = 'vm';

        return dc;
    }

    InputKmInicialCtrl.$inject = ['$scope'];

    function InputKmInicialCtrl($scope){
      var vm = this;

      vm.refreshModel = refreshModel;

      $scope.$watch('::ngModel', function(value){
        vm.model = value;
      });

      function refreshModel(){
        $scope.ngModel = vm.model;

        if($scope.ngChange){
          $scope.ngChange();
        }
      }
    }

})();

'use strict';

(function () {
    angular.module('app.viagem')
        .directive('inputKmFinal', inputKmFinal)
      .controller('InputKmFinalCtrl',InputKmFinalCtrl);

    inputKmFinal.$inject = [];

    function inputKmFinal() {
        var dc = {};

        dc.templateUrl = 'main/viagem/directives/km-final.template.html';

        dc.require = 'ngModel';

        dc.scope = {};
        dc.scope.kmInicial = '=';
        dc.scope.ngModel = '=';
        dc.scope.kmForm = '=';
        dc.scope.ngChange = '=';

        dc.controller = 'InputKmFinalCtrl';
        dc.controllerAs = 'vm';

        return dc;
    }

    InputKmFinalCtrl.$inject = ['$scope'];

    function InputKmFinalCtrl($scope){
      var vm = this;

      vm.refreshModel = refreshModel;

      $scope.$watch('::ngModel', function(value){
        vm.model = value;
      });

      function refreshModel(){
        $scope.ngModel = vm.model;

        if($scope.ngChange){
          $scope.ngChange();
        }
      }

    }

})();

'use strict';

(function() {
  angular.module('app.viagem')
    .controller('viagem.CadastroViagemCtrl', CadastroViagemCtrl);

  CadastroViagemCtrl.$inject = ['$injector', 'promiseTracker', '$moment', '$scope', '$localStorage', '$state', '$rootScope', '$ionicPopup'];

  function CadastroViagemCtrl($injector, promiseTracker, $moment, $scope, $localStorage, $state, $rootScope, $ionicPopup) {
    var vm = this,
      ViagemService = $injector.get('ViagemService'),
      LoginEventEmitter = $injector.get('LoginEventEmitter');

      var RoteiroService = $injector.get('RoteiroService');
      var MotoristaService = $injector.get('MotoristaService');
      RoteiroService.listAll(0, 1)
        .then(function(data){
          if(data.length > 0 || vm.viagem.codigoRoteiro){
            vm.roteiroExiste = true;
          }else{
            vm.roteiroExiste = undefined;
          }
        });


    init();
    var VIAGEM_DEFAULT = {
      destino:  $localStorage.getCidadePadrao().codigo,
      nomeDestino: $localStorage.getCidadePadrao().descricao,
      saida: $moment(),
      chegada: $moment(),
      kmInicial: null,
      kmFinal: null,
      observacao: null
    };

    function init() {
      vm.tracker = {};
      vm.tracker.saving = promiseTracker();
      vm.tracker.loading = promiseTracker();
      vm.goCidade = goCidade;
      vm.goRoteiro = goRoteiro;
      vm.saidaListener = saidaListener;
      vm.chegadaListener = chegadaListener;

      vm.save = save;
      vm.cancel = cancel;
      vm.focus = focus;
        vm.tracker.loading.addPromise(ViagemService.getToEdit().then(function(data) {
          console.log(data);
          vm.viagem = data || $localStorage.getViagemToEdit() || VIAGEM_DEFAULT;
          vm.viagem.motorista = $localStorage.getUsuario();
          vm.viagem.veiculo = $localStorage.getVeiculo();
          RoteiroService.getRoteiro(vm.viagem.codigoRoteiro).then(function(data){
            var  roteiro = data;
            if(roteiro){
              $localStorage.setRoteiro(roteiro[0])
            }
          }, function(data){
            console.log(data);
          });
          $localStorage.setDataSaida(vm.viagem.saida);
          $localStorage.setDataChegada(vm.viagem.chegada);
        }))

    }

    function goCidade() {
      $localStorage.setViagemToEdit(vm.viagem);
      $state.go('app.cidade');
    }

    function goRoteiro() {
      $localStorage.setViagemToEdit(vm.viagem);
      RoteiroService.setNextState('app.cad-viagem');
      RoteiroService.setLabel('Nova Viagem!');
      $state.goNoHistory('app.roteiro');
    }

    $rootScope.$on('citychanged', function(event, cidade) {
      console.log(event)
      vm.viagem =   $localStorage.getViagemToEdit();
      vm.viagem.destino = cidade.codigo;
      vm.viagem.nomeDestino = cidade.descricao;
      $localStorage.setViagemToEdit(vm.viagem);
      console.log(vm.viagem);
      $scope.$apply();
    });

    $rootScope.$on('roteirochanged', function(event, roteiro) {
      if(roteiro){
        vm.viagem = $localStorage.getViagemToEdit();
        vm.viagem.destino = roteiro.codigoCidade;
        vm.viagem.nomeDestino = roteiro.destino;
        vm.viagem.chegada = roteiro.chegada;
        vm.viagem.saida = roteiro.saida;
        vm.viagem.codigoRoteiro = roteiro.codigo;
        MotoristaService.getPorProfissional(roteiro.profissional).then(function(data){
            var userToStorage = _.pick(data, 'codigo', 'nome', 'login', 'usuario');
            vm.viagem.motorista = userToStorage;
            $localStorage.setRoteiro(roteiro);
        });
        $localStorage.setRoteiro(roteiro)
      }

      // if(!save()){
      //   vm.viagem = $localStorage.getViagemToEdit()
      // }else{
      //   $localStorage.setViagemToEdit(vm.viagem);
      // }
      $scope.$apply();
    });

    function saidaListener(data){
        $localStorage.setRoteiro(null);
        vm.viagem.codigoRoteiro = undefined;
        $localStorage.setDataSaida(data);
        if($localStorage.getDataChegada().isBefore($localStorage.getDataSaida())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A saída não pode ser maior do que a data de chegada.'
         });
          $localStorage.setDataSaida(data);
          vm.isvalidasaida = true;
        }else{
          vm.isvalidasaida = false;
        }
        vm.viagem.saida = data;

    }

    function chegadaListener(data){
        $localStorage.setDataChegada(data);
        if($localStorage.getDataSaida().isAfter($localStorage.getDataChegada())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A chegada não pode ser menor do que a saída.'
         });
          $localStorage.setDataChegada($moment());
        }

        if(moment().isBefore($localStorage.getDataChegada())){
          $ionicPopup.alert({
           title: 'Atenção',
           template: 'A chegada não pode ser maior que a data atual.'
         });
         $localStorage.setDataChegada($moment());
       }

       vm.viagem.chegada = $localStorage.getDataChegada();

    }

    function save() {
      if(vm.isvalidasaida){
        $ionicPopup.alert({
         title: 'Atenção',
         template: 'A saída não pode ser maior do que a data de chegada.'
       });
       return false;
      }
      if (vm.viagem.kmInicial >= vm.viagem.kmFinal) {
        $ionicPopup.alert({
         title: 'Atenção',
         template: 'O KM Inicial não pode ser maior que o KM Final'
        });
        return false;
      }
      var STATE_TO = 'app.viagens';

      vm.form.$setSubmitted(true);

      var eventAfterValidate = function() {
        console.log(vm.viagem)
        vm.tracker.saving.addPromise(
          ViagemService.save(vm.viagem).then(function(data) {
            vm.viagem = data;
            $state.goNoHistory(STATE_TO);
          }, function(data){
            console.log(data);
          })
        );
      };

      if (vm.form.$valid) {
        LoginEventEmitter.onSave(eventAfterValidate).then(function(valid) {
          if (valid) {
            eventAfterValidate();
          }
        });
      }
      return true;
    }

    function cancel() {
      $state.goNoHistory('app.viagens');
    }

    function focus(id, event) {
      event.stopPropagation();
      $('#' + id).focus();
    }

  }

})();

'use strict';

(function () {
  angular.module('app.usuario', ['app.common']);
})();

'use strict';

(function () {
    angular.module('app.usuario')
            .service('VeiculoService', VeiculoService);

    VeiculoService.$inject = ['DBClient', '$log', '$squel', '$state', '$q'];

    function VeiculoService(DBClient, $log, $squel, $state, $q) {
        var self = this;
        var nextState = 'app.inicio';
        var onlySelection = false;

        self.listAll = listAll;

        self.setOnlySelection = setOnlySelection;
        self.isOnlySelection = isOnlySelection;
        self.setNextState = setNextState;
        self.getNextState = getNextState;
        self.changeSelection = changeSelection;
        self.update = update;

        self.getVeiculo = getVeiculo;

        function addFieldsAll(query, alias) {
            alias = alias ? alias + '.' : '';

            return query
                    .field(alias + 'codigo')
                    .field(alias + 'descricao')
                    .field(alias + 'placa')
                    .field(alias + 'fabricante')
                    .field(alias + 'km');
        }

        function update(veiculo) {
          var sqlUpdate = $squel.update()
            .table('veiculos')
            .set('km', veiculo.km)
            .where('codigo = ?', veiculo.codigo);
          return DBClient.query(sqlUpdate.toString());
        }

        function listAll(filter, init, deep) {

            var query = addFieldsAll($squel.select().from('veiculos', 'v'), 'v');

            var applyLimit = function (sql) {
                if (init < 0 || deep < 1) {
                    return sql;
                }

                return sql.concat(' LIMIT ' + init + ', ' + deep);
            };

            angular.forEach(filter, function (value, sql) {
                value ?
                        query.where(sql, value) :
                        query.where(sql);
            });

            return DBClient.query(
                    applyLimit(
                            query
                            .order('descricao')
                            .toString()
                            )
                    ).then(DBClient.fetchAll, $log.error);
        }

        function getVeiculo(codigo) {

            var query = addFieldsAll($squel.select().from('veiculos', 'v'), 'v');

            return DBClient.query(query.where('v.codigo = ?', codigo).toString())
                    .then(function (data) {
                        return $q.when(DBClient.fetch(data));
                    }, $log.error);

        }

        function setOnlySelection(value) {
            onlySelection = value;
        }

        function isOnlySelection() {
            return onlySelection;
        }

        function setNextState(value) {
            nextState = value;
        }

        function getNextState() {
            return nextState;
        }

        function changeSelection() {
            var STATE_SELECT = 'app.veiculo';

            if ($state.current.name !== STATE_SELECT) {
                setNextState($state.current.name);
                setOnlySelection(false);

                $state.go(STATE_SELECT);
            }
        }

        return self;
    }

})();

'use strict';

(function () {
    angular.module('app.usuario')
        .controller('usuario.SelectVeiculoCtrl', SelectVeiculoCtrl);

    SelectVeiculoCtrl.$inject = ['$scope','$state', '$localStorage', 'promiseTracker', '$injector', '$ionicUtils'];

    function SelectVeiculoCtrl($scope, $state, $localStorage, promiseTracker, $injector, $ionicUtils) {
      var vm = this;
      var VeiculoService = $injector.get('VeiculoService');

      var firstRow = 0, ROWS = 9, mainEvent, mainEventSelect;

      vm.tracker = {};
      vm.tracker.loading = promiseTracker();
      vm.canLoad = true;

      vm.selectItem = selectItem;
      vm.nextStep = nextStep;
      vm.comeBack = comeBack;
      vm.loadMoreData = loadMoreData;
      vm.clear = clear;

      vm.search = search;

      init();

      function init(){
        vm.onlySelection = VeiculoService.isOnlySelection();
      }

      function selectItem(item, event){
        if(!mainEventSelect){
          mainEventSelect = event.originalEvent.constructor.name;
        }

        if(mainEventSelect === event.originalEvent.constructor.name){

          if(!!vm.itemSelected && item.codigo!==vm.itemSelected.codigo){
            vm.itemSelected.selected = false;
          }

          item.selected = !item.selected;

          vm.itemSelected = !item.selected ? null : item;
        }

      }

      function nextStep(){
        $localStorage.setVeiculo(vm.itemSelected);
        $localStorage.setHorario(moment());

        $state.goNoHistory(VeiculoService.getNextState());
      }

      function comeBack(){
        vm.itemSelected = null;

        $state.goNoHistory(VeiculoService.getNextState());
      }

      function loadMoreData(){
        var filter = vm.busca ? { 'descricao like ? ': '%'+vm.busca+'%' } : undefined;

        return VeiculoService.listAll(filter, firstRow, ROWS)
          .then(function(data){
            if(!angular.isArray(vm.veiculos)){
              vm.veiculos = [];
            }

            if(data){
              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(veiculo){
                  vm.veiculos.push(veiculo);
                });

                firstRow += ROWS;
              }

              vm.canLoad = !(data.length<ROWS);
            }else{
              vm.canLoad = false;
            }

            $scope.$broadcast('scroll.infiniteScrollComplete');
          });
      }

      function search(){
        if(!mainEvent){
          mainEvent = event.type;
        }

        if(angular.isString(mainEvent) && angular.isString(event.type) && mainEvent.toLowerCase() === event.type.toLowerCase()){
          vm.canLoad = true;
          vm.veiculos = [];
          firstRow = 0;
          $ionicUtils.toTop();
          loadMoreData();
        }
      }

      function clear(model){
        vm[model] = null;

        search({type: mainEvent});
      }
    }

})();

'use strict';

(function () {
  angular.module('app.roteiro', ['app.common']);
})();

'use strict';

(function () {
    angular.module('app.roteiro')
        .controller('usuario.SelectRoteiroCtrl', SelectRoteiroCtrl);

    SelectRoteiroCtrl.$inject = ['$scope','$state', '$localStorage', 'promiseTracker', '$injector', '$ionicUtils', '$rootScope', '$window'];

    function SelectRoteiroCtrl($scope, $state, $localStorage, promiseTracker, $injector, $ionicUtils, $rootScope, $window) {
      var vm = this;
      var RoteiroService = $injector.get('RoteiroService');
      // var popup = $injector.get('popup');
      var firstRow = 0, ROWS = 9, mainEvent, mainEventSelect;

      vm.tracker = {};
      vm.tracker.loading = promiseTracker();
      vm.canLoad = true;

      vm.selectItem = selectItem;
      vm.nextStep = nextStep;
      vm.comeBack = comeBack;
      vm.label = RoteiroService.getLabel();
      vm.loadMoreData = loadMoreData;
      vm.clear = clear;
      $localStorage.setRoteiro(undefined);

      vm.search = search;

      init();

      function init(){
        vm.onlySelection = RoteiroService.isOnlySelection();
      }

      function selectItem(item, event){
        if(!mainEventSelect){
          mainEventSelect = event.originalEvent.constructor.name;
        }

        if(mainEventSelect === event.originalEvent.constructor.name){

          if(!!vm.itemSelected && item.codigo!==vm.itemSelected.codigo){
            vm.itemSelected.selected = false;
          }

          item.selected = !item.selected;

          vm.itemSelected = !item.selected ? null : item;
        }

      }

      function nextStep(){
        var userToStorage = _.pick(vm.itemSelected, 'codigo', 'nome', 'login', 'usuario');
        $localStorage.setRoteiro(vm.itemSelected);
        $localStorage.setHorario(moment());
        // if(!!vm.itemSelected  && userToStorage.codigo !== $localStorage.getUsuario().codigo){
        //   popup.password($scope, userToStorage, RoteiroService.getNextState());
        // }else{
        if(userToStorage.nome){
          $localStorage.setUsuario(userToStorage);
        }

          $state.goNoHistory(RoteiroService.getNextState())
        // }
        // if(!vm.itemSelected){
        //   vm.itemSelected = {};
        // }
          $rootScope.$broadcast('roteirochanged', vm.itemSelected);
      }

      function comeBack(){
        vm.itemSelected = null;
        $localStorage.setRoteiro(null);
        setTimeout( function() {
          $window.history.back();
        }, 500 )
      }

      function loadMoreData(){

        return RoteiroService.listAll(firstRow, ROWS)
          .then(function(data){
            if(!angular.isArray(vm.roteiros)){
              vm.roteiros = [];
            }

            if(data){
              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(roteiro){
                  vm.roteiros.push(roteiro);
                });

                firstRow += ROWS;
              }

              vm.canLoad = !(data.length<ROWS);
            }else{
              vm.canLoad = false;
            }
            console.log(vm.roteiros.length)
            if(vm.roteiros.length === 0){
              if(RoteiroService.getNextState() === 'app.novaviagem'){
                $localStorage.setRoteiro(undefined)
                $state.goNoHistory(RoteiroService.getNextState());
              }
              return;
            }

            $scope.$broadcast('scroll.infiniteScrollComplete');
          });
      }

      function search(){
        if(!mainEvent){
          mainEvent = event.type;
        }

        if(angular.isString(mainEvent) && angular.isString(event.type) && mainEvent.toLowerCase() === event.type.toLowerCase()){
          vm.canLoad = true;
          vm.roteiros = [];
          firstRow = 0;
          $ionicUtils.toTop();
          loadMoreData();
        }
      }

      function clear(model){
        vm[model] = null;

        search({type: mainEvent});
      }
    }

})();

'use strict';

(function () {
    angular.module('app.roteiro')
            .service('RoteiroService', RoteiroService);

    RoteiroService.$inject = ['DBClient', '$log', '$squel', '$state', '$injector', '$localStorage'];

    function RoteiroService(DBClient, $log, $squel, $state, $injector, $localStorage) {
        var self = this;
        var nextState = 'app.novaviagem';
        var onlySelection = true;
        var StringBuilder = $injector.get('StringBuilder');
        var label = 'Nova Viagem!';

        self.listAll = listAll;

        self.setOnlySelection = setOnlySelection;
        self.isOnlySelection = isOnlySelection;
        self.setNextState = setNextState;
        self.getNextState = getNextState;
        self.changeSelection = changeSelection;
        self.getRoteiro = getRoteiro;
        self.getLabel = getLabel;
        self.setLabel = setLabel;

        function setLabel(_label){
          label = _label;
        }
        function getLabel(){
          return label;
        }

        function addFieldsAll() {

          return  StringBuilder.create()
                    .append('select').space()
                    .append('r.codigo codigoRoteiro,').space()
                    .append('r.codigoMotorista codigo,').space()
                    .append('r.codigoVeiculo,').space()
                    .append('r.saida,').space()
                    .append('r.localSaida,').space()
                    .append('r.chegada,').space()
                    .append('u.codigo as usuario,').space()
                    .append('u.cpf,').space()
                    .append('u.email,').space()
                    .append('u.login,').space()
                    .append('m.profissional,').space()
                    .append('m.nome nome,').space()
                    .append('c.descricao destino,').space()
                    .append('r.codigoCidade').space()
                    .append('from roteiroViagem r, cidade c, motoristas m, usuarios u').space()
                    .append('where c.codigo = r.codigoCidade').space()
                    .append('and m.codigo = r.codigoMotorista').space()
                    .append('and m.profissional = u.profissional').space()
                    .append('and r.codigoVeiculo =').space()
                    .append($localStorage.getVeiculo().codigo || -1).space();
        }

        function getRoteiro(codigo){
          var query = addFieldsAll();
          if(codigo === undefined || codigo === 'undefined'){
            codigo = -1;
          }
          query.append('and r.codigo = ' + codigo).space()
          query.append('order by r.saida asc').space();

          return DBClient.query(query.toString()).then(DBClient.fetchAll, $log.error);
        }

        function listAll(init, deep) {

            var query = addFieldsAll();
            query.append('and strftime(\'%Y-%m-%d\', r.saida) = date(\'now\', \'localtime\')').space()
            query.append('and NOT EXISTS(select 1 from viagens, roteiroViagem where roteiroViagem.codigo = viagens.codigoRoteiro) ').space()
            query.append('order by r.saida asc').space();

            var applyLimit = function (sql) {
                if (init < 0 || deep < 1) {
                    return sql;
                }

                return sql.concat(' LIMIT ' + init + ', ' + deep);
            };

            // angular.forEach(filter, function (value, sql) {
            //     value ?
            //             query.where(sql, value) :
            //             query.where(sql);
            // });
            console.log(query.toString())
            return DBClient.query(
                    applyLimit(
                            query
                            .toString()
                            )
                    ).then(DBClient.fetchAll, $log.error);
        }


        function setOnlySelection(value) {
            onlySelection = value;
        }

        function isOnlySelection() {
            return onlySelection;
        }

        function setNextState(value) {
            nextState = value;
        }

        function getNextState() {
            return nextState;
        }

        function changeSelection() {
            var STATE_SELECT = 'app.roteiro';

            if ($state.current.name !== STATE_SELECT) {
                setNextState($state.current.name);
                setOnlySelection(false);

                $state.go(STATE_SELECT);
            }
        }

        return self;
    }

})();

'use strict';

(function () {
    angular.module('app.passageiro', ['app.common']);
})();

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

'use strict';

(function () {
    angular.module('app.passageiro')
        .controller('listapassageiroctrl', function($scope, $localStorage, $state, $injector){
          var vm = this;
          var PassageiroService = $injector.get('PassageiroService');
            setTimeout(function (){
              console.log($scope.codigoRoteiro)
              PassageiroService.list(0, 1, $scope.codigoRoteiro).then(function(data) {
                if(data.length > 0){
                  vm.passageiroExiste = true;
                }else{
                  vm.passageiroExiste = undefined;
                }
              })
            }, 1000)
          vm.togglePassageiro = function(){
            if(!vm.passageiroExiste){
              return;
            }
            if($scope.readonly === 'true'){
              $localStorage.setReadOnlyPassageiros(true);
            }else{
              $localStorage.setReadOnlyPassageiros(undefined);
            }

            $state.go('app.passageiro')
          }
        })
        .directive('listapassageiro', listapassageiro);

    listapassageiro.$inject = [];

    function listapassageiro() {
        var dc = {};

        dc.templateUrl = 'main/usuario/passageiros/listapassageiro.html';

        dc.scope = {};
        dc.scope.label = '@';
        dc.scope.readonly = '@';
        dc.scope.size = '@';
        dc.scope.layout = '@';
        dc.scope.codigoRoteiro = '=';
        dc.controller = 'listapassageiroctrl';
        dc.controllerAs = 'vm';


        return dc;
    }


})();

'use strict';

(function () {

    angular.module('app.usuario')
        .controller('usuario.SelectMotoristaCtrl', SelectMotoristaCtrl);

    SelectMotoristaCtrl.$inject = ['$scope', '$injector', 'promiseTracker', '$ionicUtils','$state', '$localStorage'];

    function SelectMotoristaCtrl($scope, $injector, promiseTracker, $ionicUtils, $state, $localStorage) {
      var vm = this;
      var CidadeService = $injector.get('CidadeService');
      var popup = $injector.get('popup');
      var MotoristaService = $injector.get('MotoristaService');
      var InitConfigService = $injector.get('InitConfigService');

      var firstRow = 0, ROWS = 9, mainEvent, mainEventSelect;

      vm.tracker = {};
      vm.tracker.loading = promiseTracker();
      vm.canLoad = true;
      vm.loadMoreData = loadMoreData;

      vm.selectItem = selectItem;
      vm.nextStep = nextStep;
      vm.cancelSelection = cancelSelection;
      vm.search = search;
      vm.clear = clear;

      init();

      function init(){
        vm.onlySelection = MotoristaService.isOnlySelection();
      }

      function selectItem(item, event){
        if(!mainEventSelect){
          mainEventSelect = event.originalEvent.constructor.name;
        }

        if(mainEventSelect === event.originalEvent.constructor.name){

          if(!!vm.itemSelected && item.codigo!==vm.itemSelected.codigo){
            vm.itemSelected.selected = false;
          }

          item.selected = !item.selected;

          vm.itemSelected = !item.selected ? null : item;
        }
      }

      function nextStep(){
        var userToStorage = _.pick(vm.itemSelected, 'codigo', 'nome', 'login', 'usuario');
        CidadeService.get(vm.itemSelected.codigoCidade).then(function(data)  {
          $localStorage.setCidadePadrao(data);
          $localStorage.setCidade(data);
        })

        var nextStep = function(){
          InitConfigService.setConfigInitApp(null);
          $state.go(MotoristaService.getNextState());
        };

        popup.password($scope, userToStorage, nextStep);
      }

      function cancelSelection(){
        vm.itemSelected = null;

        if(vm.onlySelection){
          $state.goNoHistory(MotoristaService.getNextState());
        }
      }

      function loadMoreData(){
        var filter = vm.busca ? { 'm.nome like ? ': '%'+vm.busca+'%' } : undefined;

        return MotoristaService.listAll(filter, firstRow, ROWS)
          .then(function(data){
            if(!angular.isArray(vm.motoristas)){
              vm.motoristas = [];
            }

            if(data){
              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(motorista){
                  vm.motoristas.push(motorista);
                });

                firstRow += ROWS;
              }

              vm.canLoad = !(data.length<ROWS);
            }else{
              vm.canLoad = false;
            }

            $scope.$broadcast('scroll.infiniteScrollComplete');
          });
      }

      function search(event){
        if(!mainEvent){
          mainEvent = event.type;
        }

        if(angular.isString(mainEvent) && angular.isString(event.type) && mainEvent.toLowerCase() === event.type.toLowerCase()){
          vm.canLoad = true;
          vm.motoristas = [];
          firstRow = 0;
          $ionicUtils.toTop();
          loadMoreData();
        }
      }

      function clear(model){
        vm[model] = null;

        search({type: mainEvent});
      }

    }

})();

'use strict';

(function () {
    angular.module('app.usuario')
            .service('MotoristaService', MotoristaService);

    MotoristaService.$inject = ['$log', '$state', '$injector', '$q'];

    function MotoristaService($log, $state, $injector, $q) {
        var self = this;
        var onlySelectionDriver = false;
        var nextState = 'app.veiculo';
        var DEFAULT_NEXT_STATE = 'app.veiculo';
        var DBClient = $injector.get('DBClient');
        var StringBuilder = $injector.get('StringBuilder');

        self.listAll = listAll;
        self.setOnlySelection = setOnlySelection;
        self.isOnlySelection = isOnlySelection;
        self.setNextState = setNextState;
        self.getNextState = getNextState;
        self.changeSelection = changeSelection;
        self.getPorProfissional = getPorProfissional;

        self.get = get;

        function motoristaJoinUsuario() {
            return StringBuilder.create()
                    .append('select').space()
                    .append('m.codigo,').space()
                    .append('m.nome,').space()
                    .append('m.dataNascimento,').space()
                    .append('u.codigo as usuario,').space()
                    .append('u.cpf,').space()
                    .append('u.email,').space()
                    .append('u.login,').space()
                    .append('u.codigoCidade codigoCidade').space()
                    .append('from motoristas m, usuarios u').space()
                    .append('where m.profissional = u.profissional').space();
        }

        function get(codigo) {
            var findDriver = motoristaJoinUsuario()
                    .append('and m.codigo = ?', codigo).space()
                    .append('order by m.nome asc').space()
                    .toString();

            return DBClient.query(findDriver).then(
                    function (data) {
                        return $q.when(DBClient.fetch(data));
                    }, $log.error);
        }

        function getPorProfissional(codigo) {
            var findDriver = motoristaJoinUsuario()
                    .append('and m.profissional = ?', codigo).space()
                    .append('order by m.nome asc').space()
                    .toString();

            return DBClient.query(findDriver).then(
                    function (data) {
                        return $q.when(DBClient.fetch(data));
                    }, $log.error);
        }

        function listAll(filter, init, deep) {

            var query = motoristaJoinUsuario();
            var applyLimit = function (sql) {
                if (init < 0 || deep < 1) {
                    return sql;
                }

                return sql.concat('LIMIT ' + init + ', ' + deep);
            };

            angular.forEach(filter, function (value, sql) {
                query.append(' AND ');
                value ?
                        query.append(sql, value) :
                        query.append(sql);
            });

            return DBClient.query(
                    applyLimit(
                            query
                            .append('order by m.nome asc').space()
                            .toString()
                            )
                    ).then(DBClient.fetchAll, $log.error);
        }

        function setOnlySelection(value) {
            onlySelectionDriver = value;
        }

        function isOnlySelection() {
            var retorno = onlySelectionDriver;

            onlySelectionDriver = false;

            return retorno;
        }

        function setNextState(value) {
            nextState = value;
        }

        function getNextState() {
            var retorno = nextState;

            nextState = DEFAULT_NEXT_STATE;

            return retorno;
        }

        function changeSelection() {

            var STATE_SELECT = 'app.usuario';

            if ($state.current.name !== STATE_SELECT) {
                setNextState($state.current.name);
                setOnlySelection(true);

                $state.go(STATE_SELECT);
            }

        }

        return self;
    }

})();

'use strict';

(function () {
    angular.module('app.usuario')
        .factory('LoginValidator', LoginValidator);

    LoginValidator.$inject = ['$jsSHA', 'DBClient', '$log', '$q', '$squel'];

    function LoginValidator($jsSHA, DBClient, $log, $q, $squel) {
        var self = this;

        self.validate = validate;

        function validate(usuario){

          if(!usuario.senha){
            return $q.when({valid: null});
          }

          // window.localStorage.senha = usuario.senha;

          return DBClient.query(
            $squel.select()
              .from('usuarios')
              .where('login = ?', usuario.login)
              .where('senha = ?', $jsSHA.criptografar(usuario.senha))
              .toString()
          ).then(function(result) {
              $log.info(result.rows);

              return {valid: result.rows.length > 0};
          });
        }

        return self;
    }

})();

'use strict';

(function () {
    angular.module('app.usuario')
        .factory('LoginEventEmitter', LoginEventEmitter);

    LoginEventEmitter.$inject = ['$localStorage', '$injector', '$q', 'popup', 'EventEmitter', '$moment'];

    function LoginEventEmitter($localStorage, $injector, $q, popup, EventEmitter, $moment) {
        var ParametrosApp = $injector.get('ParametrosApp');
        var $rootScope = $injector.get('$rootScope');

        var eventEmitter = new EventEmitter();

        eventEmitter.eventSave(validateSession);
        eventEmitter.eventStateGo(validateSession);
        eventEmitter.event('onBeginApp', validateSessionOnBegin);


        function isValidSession(){
          var horarioStorage = $localStorage.getHorario();

          return horarioStorage.add(ParametrosApp.getTimeSession().getMinutes(), 'minutes').isAfter($moment()) &&
                 horarioStorage.format('YYYYMMDD') === $moment().format('YYYYMMDD');
        }

        function validateSession(afterEvent, isBegin){
          return $q.when(isValidSession())
             .then(function(valid){
              if(!valid && !isBegin){
                var scope = $rootScope.$new(true);

                return popup.password(scope, $localStorage.getUsuario(), afterEvent);
              }

              return valid;
          });
        }

        function validateSessionOnBegin(afterEvent){
          return validateSession(afterEvent, true);
        }

        return eventEmitter;
    }
})();

'use strict';

(function () {
  angular.module('app.cidade', ['app.common']);
})();

'use strict';

(function () {
    angular.module('app.cidade')
            .service('CidadeService', CidadeService);

    CidadeService.$inject = ['$log', '$state', '$injector', '$q'];

    function CidadeService($log, $state, $injector, $q) {
        var self = this;
        var onlySelectionDriver = true;
        var nextState = 'app.novaviagem';
        var DEFAULT_NEXT_STATE = 'app.novaviagem';
        var DBClient = $injector.get('DBClient');
        var StringBuilder = $injector.get('StringBuilder');

        self.listAll = listAll;
        self.setOnlySelection = setOnlySelection;
        self.isOnlySelection = isOnlySelection;
        self.setNextState = setNextState;
        self.getNextState = getNextState;
        self.changeSelection = changeSelection;

        self.get = get;

        function fetchCidade() {
            return StringBuilder.create()
                    .append('select').space()
                    .append('codigo,').space()
                    .append('descricao').space()
                    .append('from cidade').space()
        }

        function get(codigo) {
            var findDriver = fetchCidade()
                    .append('where codigo =').space()
                    .append(codigo).space()
                    .toString();

            return DBClient.query(findDriver).then(
                    function (data) {
                        return $q.when(DBClient.fetch(data));
                    }, $log.error);
        }

        function listAll(filter, init, deep) {

            var query = fetchCidade();

            var applyLimit = function (sql) {
                if (init < 0 || deep < 1) {
                    return sql;
                }

                return sql.concat('LIMIT ' + init + ', ' + deep);
            };

            angular.forEach(filter, function (value, sql) {
                value ?
                        query.append(sql, value) :
                        query.append(sql);
            });

            return DBClient.query(
                    applyLimit(
                            query
                            .append('order by descricao asc').space()
                            .toString()
                            )
                    ).then(DBClient.fetchAll, $log.error);
        }

        function setOnlySelection(value) {
            onlySelectionDriver = value;
        }

        function isOnlySelection() {
            var retorno = onlySelectionDriver;

            onlySelectionDriver = false;

            return retorno;
        }

        function setNextState(value) {
            nextState = value;
        }

        function getNextState() {
            var retorno = nextState;

            nextState = DEFAULT_NEXT_STATE;

            return retorno;
        }

        function changeSelection() {

            var STATE_SELECT = 'app.cidade';

            if ($state.current.name !== STATE_SELECT) {
                setNextState($state.current.name);
                setOnlySelection(true);

                $state.go(STATE_SELECT);
            }

        }

        return self;
    }

})();

'use strict';

(function () {

    angular.module('app.cidade')
        .controller('cidade.SelectCidadeCtrl', SelectCidadeCtrl);

    SelectCidadeCtrl.$inject = ['$scope', '$injector', 'promiseTracker', '$ionicUtils','$state', '$localStorage', '$rootScope', '$window']

    function SelectCidadeCtrl($scope, $injector, promiseTracker, $ionicUtils, $state, $localStorage, $rootScope, $window) {
      var vm = this;
      var CidadeService = $injector.get('CidadeService');
      var InitConfigService = $injector.get('InitConfigService');

      var firstRow = 0, ROWS = 9, mainEvent, mainEventSelect;

      vm.tracker = {};
      vm.tracker.loading = promiseTracker();
      vm.canLoad = true;
      vm.loadMoreData = loadMoreData;

      vm.selectItem = selectItem;
      vm.nextStep = nextStep;
      vm.cancelSelection = cancelSelection;
      vm.search = search;
      vm.clear = clear;

      init();

      function init(){
        vm.onlySelection = CidadeService.isOnlySelection();
      }

      function selectItem(item, event){
        if(!mainEventSelect){
          mainEventSelect = event.originalEvent.constructor.name;
        }

        if(mainEventSelect === event.originalEvent.constructor.name){

          if(!!vm.itemSelected && item.codigo!==vm.itemSelected.codigo){
            vm.itemSelected.selected = false;
          }

          item.selected = !item.selected;

          vm.itemSelected = !item.selected ? null : item;
        }
      }

      function nextStep(){
        var cityToStorage = _.pick(vm.itemSelected, 'codigo', 'descricao');

        // var nextStep = function(){
          InitConfigService.setConfigInitApp(null);
          setTimeout( function() {
            $window.history.back();
          }, 500 );
        // };
        $localStorage.setCidade(cityToStorage)
        $rootScope.$broadcast('citychanged', cityToStorage);
        // return nextStep;
      }

      function cancelSelection(){
        vm.itemSelected = null;

        if(vm.onlySelection){
          setTimeout( function() {
            $window.history.back();
          }, 500 );
        }
      }

      function loadMoreData(){
        var filter = vm.busca ? { 'where descricao like ? ': '%'+vm.busca+'%' } : undefined;

        return CidadeService.listAll(filter, firstRow, ROWS)
          .then(function(data){
            if(!angular.isArray(vm.cidades)){
              vm.cidades = [];
            }

            if(data){
              if(data.length>0 && vm.canLoad){
                angular.forEach(data, function(cidade){
                  vm.cidades.push(cidade);
                });

                firstRow += ROWS;
              }

              vm.canLoad = !(data.length<ROWS);
            }else{
              vm.canLoad = false;
            }

            $scope.$broadcast('scroll.infiniteScrollComplete');
          });
      }

      function search(event){
        if(!mainEvent){
          mainEvent = event.type;
        }

        if(angular.isString(mainEvent) && angular.isString(event.type) && mainEvent.toLowerCase() === event.type.toLowerCase()){
          vm.canLoad = true;
          vm.cidades = [];
          firstRow = 0;
          $ionicUtils.toTop();
          loadMoreData();
        }
      }

      function clear(model){
        vm[model] = null;

        search({type: mainEvent});
      }

    }

})();

angular.module("main").run(["$templateCache", function($templateCache) {$templateCache.put("main/sincronizar/sincronizando.html","<ion-view title=\"Sincronizando\">\n  <ion-content>\n    <ion-list>\n      <ion-item class=\"item item-icon-right item-card\">\n        <div class=\"card\">\n          <div class=\"item item-text-wrap item-stable\">\n            <h2>Sincronizando Dados</h2>\n          </div>\n        </div>\n      </ion-item>\n\n      <ion-item collection-repeat=\"log in vm.logSincronizacao\" class=\"item item-icon-right item-card\">\n        <div class=\"card\">\n          <div class=\"item item-text-wrap item-stable\" ng-class=\"{\'item-royal\': log.success, \'item-energized\': log.error}\">\n            {{log.mensagem}}\n          </div>\n        </div>\n      </ion-item>\n    </ion-list>\n    <ion-item ng-if=\"vm.successful\" class=\"item item-icon-right item-card\">\n      <div class=\"row\">\n        <div class=\"col col-75\">\n          <button class=\"button button-positive\" ng-click=\"vm.goHome()\">\n            OK\n          </button>\n        </div>\n      </div>\n    </ion-item>\n\n  </ion-content>\n</ion-view>\n");
$templateCache.put("main/sincronizar/sincronizar.html","<ion-view title=\"Sincronizar\">\n  <ion-content>\n    <div class=\"row padding-left padding-top padding-right\">\n      <div class=\"card\" style=\"width: 100%;\">\n        <div class=\"block-form-card\">\n          <form name=\"vm.form\">\n            <div class=\"padding\">\n              <button class=\"button button-assertive ink\" ng-click=\"vm.sincronizar()\" ng-disabled=\"vm.tracker.connecting.tracking()\">\n                <synchronize-icon ng-hide=\"vm.tracker.connecting.tracking()\"></synchronize-icon>\n                <ion-spinner ng-show=\"vm.tracker.connecting.tracking()\" icon=\"ios-small\" class=\"spinner-light\" style=\"vertical-align: middle\"></ion-spinner>\n                Sincronizar!\n              </button>\n            </div>\n          </form>\n        </div>\n      </div>\n    </div>\n  </ion-content>\n\n</ion-view>\n");
$templateCache.put("main/viagem/cadastro-viagem.html","<ion-view title=\"Cadastro Viagem\">\n\n  <ion-content>\n    <div class=\"row padding-left padding-top padding-right\">\n      <div class=\"card\" style=\"width: 100%\">\n        <div class=\"block-form-card\">\n          <form name=\"vm.form\">\n            <label class=\"row item item-input item-stacked-label\" ng-class=\"{ \'has-error\' : vm.form.destino.$invalid  && (!vm.form.destino.$pristine || vm.form.$submitted)}\">\n              <div class=\"col col-50\">\n                <div class=\"row\">\n                  Motorista: {{::vm.viagem.motorista.nome}}\n                </div>\n                <div class=\"col col-50\">\n                  Veículo: {{::vm.viagem.veiculo.descricao}}\n                </div>\n              </div>\n              <div class=\"col col-25\">\n                <div class=\"row\">\n                  <div class=\"col\">\n                    <span class=\"input-label\">Destino:</span>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <button class=\"button button-fab button-small button-calm\" ng-click=\"vm.goCidade()\">\n                    <city-icon></city-icon>\n                  </button>\n                  <div class=\"col col-80 font-24\">\n                    &nbsp;{{vm.viagem.nomeDestino}}\n                  </div>\n                </div>\n                  <div ng-messages=\"vm.form.destino.$error\" role=\"alert\" ng-show=\"!vm.form.destino.$pristine || vm.form.$submitted\">\n                    <div class=\"form-error\" ng-message=\"ck-required\">Preencha o campo \"Destino\"</div>\n                  </div>\n              </div>\n            </label>\n            <label class=\"row item item-input item-stacked-label\" data-tap-disabled=\"true\">\n              <div class=\"col col-25\">\n                <div class=\"row\">\n                  <div class=\"col\">\n                    <span class=\"input-label\">Data Inicial:</span>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <div id=\"chegadaDate\" class=\"col col-20\">\n                    <ck-button-date ng-model=\"vm.viagem.saida\" listener=\"vm.saidaListener\">\n                      <calendar-icon></calendar-icon>\n                    </ck-button-date>\n                  </div>\n                  <div class=\"col col-80 font-24\">\n                    {{vm.viagem.saida | momentToDate}}\n                  </div>\n                </div>\n              </div>\n              <div class=\"col col-25\">\n                <div class=\"row\">\n                  <div class=\"col\">\n                    <span class=\"input-label\">Horário Inicial:</span>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <div id=\"chegadaTime\" class=\"col col-20\">\n                    <ck-button-time ng-model=\"vm.viagem.saida\" listener=\"vm.saidaListener\">\n                      <clock-icon></clock-icon>\n                    </ck-button-time>\n                  </div>\n                  <div class=\"col col-80 font-24\">\n                    {{vm.viagem.saida | momentToTime}}\n                  </div>\n                </div>\n              </div>\n              <div class=\"col col-25\" ng-click=\"vm.openDatePicker(vm.viagem.chegada)\">\n                <div class=\"row\">\n                  <div class=\"col\">\n                    <span class=\"input-label\">Data Final:</span>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <div id=\"finalDate\" class=\"col col-20\">\n                    <ck-button-date ng-model=\"vm.viagem.chegada\" listener=\"vm.chegadaListener\">\n                      <calendar-icon></calendar-icon>\n                    </ck-button-date>\n                  </div>\n                  <div class=\"col col-80 font-24\">\n                    {{vm.viagem.chegada | momentToDate}}\n                  </div>\n                </div>\n              </div>\n              <div class=\"col col-25\" ng-click=\"vm.openTimePicker(vm.viagem.chegada)\">\n                <div class=\"row\">\n                  <div class=\"col\">\n                    <span class=\"input-label\">Horário Final:</span>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <div id=\"finalTime\" class=\"col col-20\">\n                    <ck-button-time ng-model=\"vm.viagem.chegada\" listener=\"vm.chegadaListener\">\n                      <clock-icon></clock-icon>\n                    </ck-button-time>\n                  </div>\n                  <div class=\"col col-80 font-24\">\n                    {{vm.viagem.chegada | momentToTime}}\n                  </div>\n                </div>\n              </div>\n            </label>\n            <div class=\"row\">\n              <label class=\"item item-input item-stacked-label\" data-tap-disabled=\"true\">\n                <listapassageiro codigoRoteiro=\"vm.viagem.codigoRoteiro\" layout=\"1\" readOnly=\"true\" class=\"col-25\" size=\"4\" label=\"Passageiros\"></listapassageiro>\n              </label>\n              <label class=\"item item-input item-stacked-label\" data-tap-disabled=\"true\">\n                <listapassageiro codigoRoteiro=\"vm.viagem.codigoRoteiro\" layout=\"1\" readOnly=\"false\" class=\"col-25\" size=\"4\" label=\"Presença\"></listapassageiro>\n              </label>\n              <label class=\"item item-input item-stacked-label\" data-tap-disabled=\"true\">\n                <div class=\"col col-25\">\n                  <div class=\"row\">\n                    <div class=\"col\" style=\"margin-top: -8px\">\n                      <span class=\"input-label\">Roteiro:</span>\n                    </div>\n                  </div>\n                  <div class=\"row\">\n                    <button ng-show=\"vm.roteiroExiste\" class=\"button button-fab button-small button-calm\" ng-click=\"vm.goRoteiro()\">\n                      <editlocation-icon></editlocation-icon>\n                    </button>\n                    <button ng-show=\"!vm.roteiroExiste\" class=\"button button-fab button-small button-calm bt-disabled\">\n                      <editlocation-icon></editlocation-icon>\n                    </button>\n                  </div>\n                </div>\n              </label>\n            </div>\n            <label class=\"row item item-input item-stacked-label\" data-tap-disabled=\"true\">\n              <div class=\"col col-33\">\n                <div class=\"row\" ng-click=\"vm.focus(\'kmInicial\', $event)\">\n                  <div class=\"col\">\n                    <span class=\"input-label\">KM Inicial:</span>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <input-km-inicial ng-model=\"vm.viagem.kmInicial\" km-final=\"vm.viagem.kmFinal\" km-form=\"vm.form\"></input-km-inicial>\n                </div>\n              </div>\n              <div class=\"col col-33\">\n                <div class=\"row\" ng-click=\"vm.focus(\'kmFinal\', $event)\">\n                  <div class=\"col\">\n                    <span class=\"input-label\">KM Final:</span>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <input-km-final ng-model=\"vm.viagem.kmFinal\" km-inicial=\"vm.viagem.kmInicial\" km-form=\"vm.form\"></input-km-final>\n                </div>\n              </div>\n              <div class=\"col col-33\">\n                <div class=\"row\">\n                  <div class=\"col\">\n                    <span class=\"input-label\">Local Saída:</span>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <input required=\"required\" name=\"localSaida\" style=\"display:block; height: 32px;\" ng-model=\"vm.viagem.localSaida\" />\n                </div>\n                <div class=\"row\" role=\"alert\">\n                  <div class=\"form-error\" ng-if=\"vm.form.localSaida.$invalid && (!vm.form.localSaida.$pristine || vm.form.$submitted)\">Preencha o campo \"Local de Saída\"</div>\n                </div>\n              </div>\n            </label>\n            <label class=\"row item item-input item-stacked-label\">\n              <div class=\"col\">\n                <div class=\"row\">\n                  <div class=\"col\">\n                    <span class=\"input-label\">Observação:</span>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <textarea rows=\"3\" cols=\"100\" ng-model=\"vm.viagem.observacao\" ck-max-length=\"200\"></textarea>\n                </div>\n              </div>\n            </label>\n          </form>\n        </div>\n      </div>\n    </div>\n\n    <div></div>\n\n    <div class=\" padding-left padding-right\">\n      <div class=\"row\">\n        <div class=\"col col-50\">\n          <button class=\"button button-full button-large button-stable ink\" ng-click=\"vm.cancel()\">\n            <cancel-icon></cancel-icon>\n            Cancelar\n          </button>\n        </div>\n        <div class=\"col col-50\">\n          <button class=\"button button-full button-large button-positive ink\" ng-click=\"vm.save()\">\n            <save-icon></save-icon>\n            Salvar\n          </button>\n        </div>\n      </div>\n    </div>\n  </ion-content>\n\n</ion-view>\n");
$templateCache.put("main/viagem/viagens-encerradas.html","<ion-view title=\"Manutenção das Viagens\" attach-to-window=\"true\">\n\n  <ion-pane>\n    <ion-header-bar class=\"bar-subheader sub-header alice duo\">\n      <div class=\"row item-input-inset\">\n        <div class=\"col col-33\">\n          <label class=\"item-input-wrapper\">\n            <i class=\"icon ion-ios-search placeholder-icon\"></i>\n            <input type=\"search\" placeholder=\"Destino\" ng-model=\"vm.busca\">\n            <clear-icon ng-show=\"vm.busca\" ng-click=\"vm.clear(\'busca\')\"></clear-icon>\n          </label>\n        </div>\n        <div class=\"col col-25\" style=\"height: 43px;\">\n          <label class=\"item-input-wrapper\" style=\"height: 100%;\">\n            <div class=\"row\" style=\"font-size: 17px;\">\n              <div class=\"col col-90\" ng-click=\"vm.changeDate()\">\n                <span class=\"span-input\">Saida: {{vm.buscaSaida | momentToDate}}</span>\n              </div>\n              <div class=\"col col-10\" style=\"color: #D64541;\">\n                <clear-icon ng-show=\"vm.buscaSaida\"  ng-click=\"vm.clear(\'buscaSaida\')\"></clear-icon>\n              </div>\n            </div>\n          </label>\n        </div>\n        <div class=\"col col-33\">\n          <button class=\"button button-energized\" ng-click=\"vm.search($event)\"\n                  style=\"width: 100px\">\n            <b>Buscar</b>\n          </button>\n        </div>\n      </div>\n      <div class=\"row\">\n        <div class=\"col col-33\">\n          <button class=\"button button-positive\" style=\"width: 150px;\" ng-click=\"vm.novaViagem()\">\n            <plus-icon class=\"vertical-align-middle\"></plus-icon>\n            <b>Adicionar</b></button>\n        </div>\n      </div>\n    </ion-header-bar>\n    <ion-content class=\"c-has-filter ion-content duo\">\n      <ion-list>\n        <ion-item ng-show=\"vm.tracker.loading.active()\" class=\"col-center card\">\n          <ion-spinner icon=\"android\"></ion-spinner>\n          Carregando ...\n        </ion-item>\n        <ion-item ng-show=\"vm.viagens.length===0 && vm.busca\" class=\"item item-icon-right item-card\">\n          <div class=\"row card padding-top\">\n            Não foi encontrado nenhum registro com a descricao <b>\"{{vm.busca}}\"</b>\n          </div>\n        </ion-item>\n        <ion-item collection-repeat=\"viagem in vm.viagens\"\n                  item=\"viagem\"\n                  collection-item-height=\"150\"\n                  collection-item-width=\"\'100%\'\"\n                  class=\"item item-icon-right item-card\">\n          <div class=\"row card padding-top\" ng-show=\"!viagem.toDelete\">\n            <div class=\"col col-10 padding-top col-center\" ng-show=\"!viagem.toDelete\">\n              <div class=\"button button-fab icon-md-48 avatar\" ng-click=\"vm.edit(viagem)\">\n                <car-icon></car-icon>\n              </div>\n            </div>\n            <div class=\"col col-75 padding-left\" style=\"font-size: 20px\">\n              <div class=\"row\">\n                <div class=\"col padding-left\">\n                  Motorista: {{::vm.motorista.nome}}\n                </div>\n              </div>\n              <div class=\"row\">\n                <div class=\"col col-50  padding-left\">\n                  Veículo: {{::vm.veiculo.descricao}}\n                </div>\n                <div class=\"col col-50 padding-left\">\n                  Destino: {{viagem.nomeDestino}}\n                </div>\n              </div>\n              <div class=\"row\">\n                <div class=\"col col-50 padding-left\">\n                  Saída: {{viagem.saida | momentToDate}} às {{viagem.saida | momentToTime}}\n                </div>\n                <div class=\"col col-50 padding-left\">\n                  Chegada: {{viagem.chegada | momentToDate}} às {{viagem.chegada | momentToTime}}\n                </div>\n              </div>\n            </div>\n            <div class=\"col col-10 col-center padding-left\">\n              <div class=\"col col-50 padding-left\">\n                <button class=\"button button-fab icon-md-32 button-calm\" ng-click=\"vm.edit(viagem)\">\n                  <edit-item-icon></edit-item-icon>\n                </button>\n              </div>\n              <div class=\"col col-50 padding-left\">\n                <button class=\"button button-fab icon-md-32 button-assertive\"\n                        ng-click=\"vm.toDelete(viagem)\">\n                  <delete-item-icon></delete-item-icon>\n                </button>\n              </div>\n            </div>\n          </div>\n          <div class=\"row card padding-top item-to-delete padding-right\" ng-show=\"viagem.toDelete\">\n            <div class=\"col col-75 padding-top padding-left\" style=\"font-size: 20px\">\n              <div class=\"row\">\n                <div class=\"col padding-left\">\n                  Motorista: {{::vm.motorista.nome}}\n                </div>\n              </div>\n              <div class=\"row\">\n                <div class=\"col col-50  padding-left\">\n                  Veículo: {{::vm.veiculo.descricao}}\n                </div>\n                <div class=\"col col-50 padding-left\">\n                  Destino: {{viagem.nomeDestino}}\n                </div>\n              </div>\n              <div class=\"row\">\n                <div class=\"col col-50 padding-left\">\n                  Saída: {{viagem.saida | momentToDate}} às {{viagem.saida | momentToTime}}\n                </div>\n                <div class=\"col col-50 padding-left\">\n                  Chegada: {{viagem.chegada | momentToDate}} às {{viagem.chegada | momentToTime}}\n                </div>\n              </div>\n            </div>\n            <div class=\"col col-25 col-center padding-left card block-form-card padding-right\">\n              <div class=\"col padding-vertical-zero\">\n                <h2>Deseja excluir esta viagem?</h2>\n              </div>\n              <div class=\"col padding-vertical-zero\">\n                <button class=\"button button-block button-small button-assertive\" ng-click=\"vm.deleteViagem(viagem)\">\n                  <done-icon></done-icon>\n                  SIM\n                </button>\n              </div>\n              <div class=\"col padding-vertical-zero\">\n                <button class=\"button button-block button-small button-dark\" ng-click=\"vm.toDelete(viagem)\">\n                  <cancel-icon></cancel-icon>\n                  NÃO\n                </button>\n              </div>\n            </div>\n          </div>\n        </ion-item>\n        <ion-infinite-scroll\n          on-infinite=\"vm.loadMoreData()\"\n          ng-if=\"vm.canLoad\"\n          icon=\"ion-loading-c\"\n          distance=\"1%\">\n        </ion-infinite-scroll>\n      </ion-list>\n    </ion-content>\n  </ion-pane>\n</ion-view>\n");
$templateCache.put("main/view-inicial/inicio.html","<ion-view title=\"Diário de Bordo\">\n  <ion-content>\n    <div class=\"row\">\n      <div class=\"col col-50\">\n        <div class=\"list card\">\n          <div class=\"item item-body\">\n            <div class=\"row padding-left\">\n              <button class=\"button my-button-full button-full button-large button-royal ink\" ui-sref=\"app.roteiro\" ng-show=\"vm.estadosViagem.novaViagem\">\n                <new-travel-icon class=\"icon-md-36\"></new-travel-icon>\n                <span class=\"padding-left\" style=\"font-size:20px; vertical-align: middle;\"><b>Iniciar Viagem</b></span>\n              </button>\n              <button class=\"button my-button-full button-full button-large button-royal ink\" ui-sref=\"app.viajando\" ng-show=\"vm.estadosViagem.viajando || vm.estadosViagem.encerrando\">\n                <traveling-icon class=\"icon-md-36\"></traveling-icon>\n                <span class=\"padding-left\" style=\"font-size:20px; vertical-align: middle;\"><b>Em viagem</b></span>\n              </button>\n            </div>\n            <div class=\"row padding-left\">\n              <button class=\"button my-button-full button-full button-large button-royal ink\" ui-sref=\"app.viagens\">\n                <travels-icon class=\"icon-md-36\"></travels-icon>\n                <span class=\"padding-left\" style=\"font-size:20px; vertical-align: middle;\"><b>Manutenção</b></span>\n              </button>\n            </div>\n            <div class=\"row padding-left\">\n              <button class=\"button my-button-full button-full button-large button-royal ink\" ui-sref=\"app.usuario\">\n                <user-icon class=\"icon-md-36\"></user-icon>\n                <span class=\"padding-left\" style=\"font-size:20px; vertical-align: middle;\"><b>Alterar Usuário</b></span>\n              </button>\n            </div>\n            <div class=\"row padding-left\">\n              <button class=\"button my-button-full button-full button-large button-royal ink\" ui-sref=\"app.sincronizar\">\n                <synchronize-icon class=\"icon-md-36\"></synchronize-icon>\n                <span class=\"padding-left\" style=\"font-size:20px; vertical-align: middle;\"><b>Sincronizar Dados</b></span>\n              </button>\n            </div>\n            <div class=\"row padding-left\">\n              <button class=\"button my-button-full button-full button-large button-royal ink\" ui-sref=\"app.configuracao\">\n                <config-icon class=\"icon-md-36\"></config-icon>\n                <span class=\"padding-left\" style=\"font-size:20px; vertical-align: middle;\"><b>Configurações</b></span>\n              </button>\n            </div>\n          </div>\n        </div>\n      </div>\n      <div class=\"col col-offset-10 col-33\">\n        <div class=\"list\">\n          <div class=\"item item-body card color-gallery padding\">\n            <div class=\"text-right\">\n              <div style=\"font-size: 30px;\">{{vm.time | momentToTime}} - {{vm.time | momentToDate}}</div>\n              <h2>Veículo: {{vm.veiculo.descricao}}</h2>\n              <h2>Motorista: {{vm.user.nome}}</h2>\n              <img style=\"background-color: #FFFFFF; padding: 10px; left: 10%;\" src=\"main/assets/images/iniciofrota.png\" />\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("main/common/configuracao/configuracao.html","<ion-view title=\"Configurações\">\n\n  <ion-content>\n    <div class=\"list\">\n      <div class=\"row\">\n        <div class=\"col col-50\">\n          <label class=\"item item-input item-stacked-label\">\n            <span class=\"input-label\">Tempo de Duração da Sessão (min)</span>\n            <input type=\"number\" ng-model=\"vm.configuracao.timeSession\" min=\"1\">\n          </label>\n        </div>\n      </div>\n      <div class=\"row\">\n        <div class=\"col col-50\">\n          <label class=\"item item-input item-stacked-label\">\n            <span class=\"input-label\">Usuário de Sincronização</span>\n            <input type=\"text\" style=\"display:block;\" ng-model=\"vm.configuracao.usuario\">\n          </label>\n        </div>\n      </div>\n      <div class=\"row\">\n        <div class=\"col col-50\">\n          <label class=\"item item-input item-stacked-label\">\n            <span class=\"input-label\">Senha de Sincronização</span>\n            <input type=\"password\" style=\"display:block;\" ng-model=\"vm.configuracao.senha\">\n          </label>\n        </div>\n      </div>\n      <div class=\"row\">\n        <div class=\"col col-50\">\n          <label class=\"item item-input item-stacked-label\">\n            <span class=\"input-label\">URL de Sincronização</span>\n            <input type=\"text\" style=\"display:block;\" ng-model=\"vm.configuracao.url\">\n          </label>\n        </div>\n      </div>\n      <div class=\"row\">\n        <div class=\"col col-25\">\n          <label class=\"item item-input\">\n            <button class=\"button button-block button-positive\" ng-click=\"vm.save()\"><save-icon></save-icon>   Salvar</button>\n          </label>\n        </div>\n      </div>\n    </div>\n  </ion-content>\n\n</ion-view>\n");
$templateCache.put("main/common/menu/menu.html","<ion-side-menus enable-menu-with-back-views=\"false\">\n\n  <!-- CONTENT -->\n  <ion-side-menu-content>\n\n    <!-- header bar -->\n    <!-- the nav bar will be updated as we navigate between views -->\n    <ion-nav-bar class=\"bar-balanced\">\n      <!-- back button, shown if applicable -->\n      <ion-nav-back-button>\n      </ion-nav-back-button>\n      <!-- nav button, shown if applicable -->\n      <ion-nav-buttons side=\"left\">\n        <button class=\"button button-icon button-clear ion-navicon\" menu-toggle=\"left\">\n        </button>\n      </ion-nav-buttons>\n    </ion-nav-bar>\n\n    <!-- ROUTING INJECTED HERE: pageContent -->\n    <ion-nav-view name=\"pageContent\"></ion-nav-view>\n\n  </ion-side-menu-content>\n\n  <!-- SIDEMENU -->\n  <ion-side-menu side=\"left\">\n\n    <!-- menu header -->\n    <ion-header-bar class=\"bar-balanced\">\n      <h1 class=\"title\">Menu</h1>\n    </ion-header-bar>\n\n    <!-- menu content -->\n    <ion-content>\n      <ion-list>\n        <ion-item menu-close ui-sref=\"app.inicio\">\n          <home-icon></home-icon> Página Inicial\n        </ion-item>\n        <ion-item menu-close ui-sref=\"app.usuario\">\n          <user-icon></user-icon> Alterar Usuário\n        </ion-item>\n        <ion-item menu-close ng-click=\"vm.go(\'app.novaviagem\')\" ng-show=\"vm.estadosViagem.novaViagem\" >\n          <new-travel-icon></new-travel-icon> Nova Viagem\n        </ion-item>\n        <ion-item menu-close ng-click=\"vm.go(\'app.viajando\')\" ng-show=\"vm.estadosViagem.viajando\">\n          <traveling-icon></traveling-icon> Em viagem\n        </ion-item>\n        <ion-item menu-close ng-click=\"vm.go(\'app.encerrando-viagem\')\" ng-show=\"vm.estadosViagem.encerrando\">\n          <done-icon></done-icon> Encerrar Viagem\n        </ion-item>\n        <ion-item menu-close ng-click=\"vm.go(\'app.viagens\')\">\n          <travels-icon></travels-icon> Viagens Encerradas\n        </ion-item>\n        <ion-item menu-close ui-sref=\"app.sincronizar\">\n          <synchronize-icon></synchronize-icon> Sincronizar Dados\n        </ion-item>\n        <ion-item menu-close ui-sref=\"app.configuracao\">\n          <config-icon></config-icon> Configurações\n        </ion-item>\n      </ion-list>\n    </ion-content>\n  </ion-side-menu>\n</ion-side-menus>\n");
$templateCache.put("main/common/popups/password.template.html","<div class=\"row\">\n  <div class=\"col\">\n    Usuário: {{::usuario.login}}\n  </div>\n</div>\n\n<div class=\"row\">\n  <div class=\"col item-stacked-label\">\n    <input type=\"password\" placeholder=\"Senha\" ng-model=\"usuario.senha\">\n  </div>\n</div>\n<div class=\"assertive text-center error-login\" ng-if=\"passwordError\">\n  <div class=\"col\">\n    Senha não informada\n  </div>\n</div>\n<div class=\"assertive text-center error-login\" ng-if=\"passwordInvalid\">\n  <div class=\"col\">\n    Usuário ou senha inválidos\n  </div>\n</div>\n");
$templateCache.put("main/usuario/cidade/cidade.html","<ion-view title=\"Selecionando Cidade\">\n  <ion-pane>\n    <ion-header-bar class=\"bar-subheader sub-header alice\">\n      <div class=\"row item-input-inset\">\n        <div class=\"col col-50\">\n          <label class=\"item-input-wrapper\">\n            <i class=\"icon ion-ios-search placeholder-icon\"></i>\n            <input type=\"search\" placeholder=\"Buscar Cidade\" ng-model=\"vm.busca\">\n            <clear-icon ng-show=\"vm.busca\" ng-click=\"vm.clear(\'busca\');\"></clear-icon>\n          </label>\n        </div>\n        <div class=\"col col-33\">\n          <button class=\"button button-energized\"style=\"width: 100px\" ng-click=\"vm.search($event)\">\n            <b>Buscar</b>\n          </button>\n        </div>\n      </div>\n    </ion-header-bar>\n    <ion-content class=\"ion-content\" overflow-scroll=\"true\">\n      <ion-list>\n        <ion-item ng-show=\"!vm.tracker.loading.tracking()\"\n                  collection-repeat=\"cidade in vm.cidades\" class=\"item item-icon-right item-card\"\n                  item=\"cidade\"\n                  item-width=\"100%\"\n                  item-height=\"55px\"\n                  ng-click=\"vm.selectItem(cidade, $event);\">\n          <div class=\"card\">\n            <div class=\"item item-text-wrap\" ng-class=\"{\'item-positive\': cidade.codigo === vm.itemSelected.codigo && vm.itemSelected, \'item-stable\': !vm.itemSelected && cidade.codigo !== vm.itemSelected.codigo}\">\n              {{cidade.descricao}}\n              <done-icon ng-if=\"cidade.codigo === vm.itemSelected.codigo && vm.itemSelected\"></done-icon>\n            </div>\n          </div>\n        </ion-item>\n        <ion-item ng-show=\"vm.tracker.loading.tracking()\"\n                  item-width=\"100%\"\n                  item-height=\"55px\">\n          <div class=\"card\">\n            <div class=\"item item-text-wrap item-stable\">\n              Carregando lista\n            </div>\n          </div>\n        </ion-item>\n        <ion-infinite-scroll\n          ng-if=\"vm.canLoad\"\n          icon=\"ion-loading-c\"\n          on-infinite=\"vm.loadMoreData()\"\n          distance=\"1%\">\n        </ion-infinite-scroll>\n      </ion-list>\n    </ion-content>\n    <ion-footer-bar ng-show=\"!!vm.itemSelected\" style=\"height: 12%\" class=\"silver\">\n      <div class=\"col col-50\">\n        <button class=\"button button-full button-large button-stable ink\" ng-click=\"vm.cancelSelection()\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <back-icon ng-show=\"vm.onlySelection\"></back-icon>\n          <span ng-show=\"vm.onlySelection\">Voltar!</span>\n          <cancel-icon ng-hide=\"vm.onlySelection\"></cancel-icon>\n          <span ng-hide=\"vm.onlySelection\">Cancelar</span>\n        </button>\n      </div>\n      <div class=\"col col-50\">\n        <button class=\"button button-full button-large button-stable ink\" ng-click=\"vm.nextStep()\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <done-icon ng-show=\"vm.onlySelection\"></done-icon>\n          <next-icon ng-hide=\"vm.onlySelection\"></next-icon>\n          <span ng-hide=\"vm.onlySelection\">Avançar!</span>\n          <span ng-show=\"vm.onlySelection\">OK!</span>\n        </button>\n      </div>\n    </ion-footer-bar>\n  </ion-pane>\n</ion-view>\n");
$templateCache.put("main/usuario/motorista/select-motorista.html","<ion-view title=\"Selecionando Motorista\">\n  <ion-pane>\n    <ion-header-bar class=\"bar-subheader sub-header alice\">\n      <div class=\"row item-input-inset\">\n        <div class=\"col col-50\">\n          <label class=\"item-input-wrapper\">\n            <i class=\"icon ion-ios-search placeholder-icon\"></i>\n            <input type=\"search\" placeholder=\"Buscar Motorista\" ng-model=\"vm.busca\">\n            <clear-icon ng-show=\"vm.busca\" ng-click=\"vm.clear(\'busca\');\"></clear-icon>\n          </label>\n        </div>\n        <div class=\"col col-33\">\n          <button class=\"button button-energized\"style=\"width: 100px\" ng-click=\"vm.search($event)\">\n            <b>Buscar</b>\n          </button>\n        </div>\n      </div>\n    </ion-header-bar>\n    <ion-content class=\"ion-content\" overflow-scroll=\"true\">\n      <ion-list>\n        <ion-item ng-show=\"!vm.tracker.loading.tracking()\"\n                  collection-repeat=\"motorista in vm.motoristas\" class=\"item item-icon-right item-card\"\n                  item=\"motorista\"\n                  item-width=\"100%\"\n                  item-height=\"55px\"\n                  ng-click=\"vm.selectItem(motorista, $event);\">\n          <div class=\"card\">\n            <div class=\"item item-text-wrap\" ng-class=\"{\'item-positive\': motorista.codigo === vm.itemSelected.codigo && vm.itemSelected, \'item-stable\': !vm.itemSelected && motorista.codigo !== vm.itemSelected.codigo}\">\n              {{motorista.nome}} - {{motorista.dataNascimento | momentToDate}}\n              <done-icon ng-if=\"motorista.codigo === vm.itemSelected.codigo && vm.itemSelected\"></done-icon>\n            </div>\n          </div>\n        </ion-item>\n        <ion-item ng-show=\"vm.tracker.loading.tracking()\"\n                  item-width=\"100%\"\n                  item-height=\"55px\">\n          <div class=\"card\">\n            <div class=\"item item-text-wrap item-stable\">\n              Carregando lista\n            </div>\n          </div>\n        </ion-item>\n        <ion-infinite-scroll\n          ng-if=\"vm.canLoad\"\n          icon=\"ion-loading-c\"\n          on-infinite=\"vm.loadMoreData()\"\n          distance=\"1%\">\n        </ion-infinite-scroll>\n      </ion-list>\n\n\n    </ion-content>\n    <ion-footer-bar ng-show=\"!!vm.itemSelected\" style=\"height: 12%\" class=\"silver\">\n      <div class=\"col col-50\">\n        <button class=\"button button-full button-large button-stable ink\" ng-click=\"vm.cancelSelection()\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <back-icon ng-show=\"vm.onlySelection\"></back-icon>\n          <span ng-show=\"vm.onlySelection\">Voltar!</span>\n          <cancel-icon ng-hide=\"vm.onlySelection\"></cancel-icon>\n          <span ng-hide=\"vm.onlySelection\">Cancelar</span>\n        </button>\n      </div>\n      <div class=\"col col-50\">\n        <button class=\"button button-full button-large button-stable ink\" ng-click=\"vm.nextStep()\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <done-icon ng-show=\"vm.onlySelection\"></done-icon>\n          <next-icon ng-hide=\"vm.onlySelection\"></next-icon>\n          <span ng-hide=\"vm.onlySelection\">Avançar!</span>\n          <span ng-show=\"vm.onlySelection\">OK!</span>\n        </button>\n      </div>\n    </ion-footer-bar>\n  </ion-pane>\n</ion-view>\n\n");
$templateCache.put("main/usuario/passageiros/listapassageiro.html","<div ng-if=\"!layout\"  class=\"row\">\n  <div ng-if=\"size === \'2\'\" class=\"col col col-75 text-vertical-middle\" ><h2>{{label}}</h2></div>\n  <div ng-if=\"size === \'3\'\" class=\"col col-80 text-vertical-middle\" ><h3>{{label}}</h3></div>\n  <div ng-if=\"size === \'4\'\" class=\"col col-80 text-vertical-middle\" ><h4>{{label}}</h4></div>\n  <div ng-if=\"size === \'2\'\" class=\"col col-25 button-block-vertical padding-left\" style=\"margin-left: -10px;\">\n    <button ng-show=\"vm.passageiroExiste\" ng-click=\"vm.togglePassageiro()\" class=\"button button-fab button-small button-calm\" >\n      <people-icon></people-icon>\n    </button>\n    <button ng-show=\"!vm.passageiroExiste\" class=\"button button-fab button-small button-calm bt-disabled\">\n      <people-icon></people-icon>\n    </button>\n  </div>\n  <div ng-if=\"size !== \'2\'\" class=\"col col-25 button-block-vertical padding-left\" style=\"margin-left: -10px;\">\n    <button ng-show=\"vm.passageiroExiste\" ng-click=\"vm.togglePassageiro()\" class=\"button button-fab button-small button-calm\" >\n      <people-icon></people-icon>\n    </button>\n    <button ng-show=\"!vm.passageiroExiste\" class=\"button button-fab button-small button-calm bt-disabled\">\n      <people-icon></people-icon>\n    </button>\n  </div>\n</div>\n\n<div ng-if=\"layout === \'1\'\" class=\"col-25\">\n  <div class=\"row\">\n    <div class=\"col\">\n      <span class=\"input-label\">{{label}}:</span>\n    </div>\n  </div>\n  <div class=\"row\">\n    <div class=\"col col-20\">\n      <button ng-show=\"vm.passageiroExiste\" ng-click=\"vm.togglePassageiro()\" class=\"button button-fab button-small button-calm\" >\n        <people-icon></people-icon>\n      </button>\n      <button ng-show=\"!vm.passageiroExiste\" class=\"button button-fab button-small button-calm bt-disabled\">\n        <people-icon></people-icon>\n      </button>\n    </div>\n    <div class=\"col col-80 font-24\">\n    </div>\n  </div>\n</div>\n");
$templateCache.put("main/usuario/passageiros/passageiros.html","<ion-view title=\"{{vm.title}}\" attach-to-window=\"true\">\n  <ion-pane>\n    <ion-content>\n      <ion-list>\n        <ion-item ng-show=\"vm.tracker.loading.active()\" class=\"col-center card\">\n          <ion-spinner icon=\"android\"></ion-spinner>\n          Carregando ...\n        </ion-item>\n        <ion-item ng-show=\"vm.passageiros.length===0\" class=\"item item-icon-right item-card\">\n          <div class=\"row card\">\n            Não há passageiros listados para a viagem.\n          </div>\n        </ion-item>\n        <ion-item collection-repeat=\"passageiro in vm.passageiros\"\n                  item=\"passageiro\"\n                  collection-item-height=\"215\"\n                  collection-item-width=\"\'100%\'\"\n                  class=\"item item-icon-right item-card\">\n          <div class=\"row card\" ng-click=\"vm.save(passageiro)\">\n            <div class=\"col col-10 col-center\">\n              <div ng-show=\"passageiro.status === 2\" class=\"button button-fab icon-md-48 avatarGreen\" >\n                <check-icon></check-icon>\n              </div>\n              <div ng-show=\"passageiro.status === 1\" class=\"button button-fab icon-md-48 avatarRed\">\n                <clear-icon></clear-icon>\n              </div>\n            </div>\n            <div class=\"col col-75 padding-left\" style=\"font-size: 20px\">\n              <div class=\"row\">\n                <div class=\"col padding-left\">\n                  Passageiro: {{passageiro.nomeUsuario}}\n                </div>\n              </div>\n              <div class=\"row\">\n                <div class=\"col col-50  padding-left\">\n                  Local Embarque: {{passageiro.localEmbarque}}\n                </div>\n                <div class=\"col col-50 padding-left\">\n                  Destino: {{passageiro.destino}}\n                </div>\n              </div>\n              <div class=\"row\">\n                <div class=\"col col-50 padding-left\">\n                  Tipo: {{passageiro.tpViagem}}\n                </div>\n              </div>\n            </div>\n          </div>\n\n          <div class=\"row card\" >\n            <div class=\"col col-10\" >\n            </div>\n            <div ng-show =\"!!passageiro.openDescription\" class=\"col col-75 padding-left\" style=\"font-size: 20px\">\n              <div class=\"row\">\n                <div class=\"col padding-left\">\n                  Telefone: {{passageiro.telefone}}\n                </div>\n              </div>\n              <div class=\"row\">\n                <div class=\"col padding-left\">\n                  Horário: {{passageiro.horario | momentToTime}}\n                </div>\n                <div class=\"col  padding-left\">\n                  Observação: {{passageiro.observacao}}\n                </div>\n              </div>\n            </div>\n          </div>\n\n        </ion-item>\n        <ion-infinite-scroll\n          on-infinite=\"vm.loadMoreData()\"\n          ng-if=\"vm.canLoad\"\n          icon=\"ion-loading-c\"\n          distance=\"1%\">\n        </ion-infinite-scroll>\n      </ion-list>\n    </ion-content>\n    <ion-footer-bar style=\"height: 12%\" class=\"silver\">\n      <div class=\"col\">\n        <button class=\"button button-full button-large button-stable ink\" ng-click=\"vm.back();\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <done-icon></done-icon>\n          <span>OK</span>\n        </button>\n      </div>\n    </ion-footer-bar>\n  </ion-pane>\n</ion-view>\n");
$templateCache.put("main/usuario/roteiro/select-roteiro.html","<ion-view title=\"Selecionando Roteiro de Viagem\" attach-to-window=\"true\">\n  <ion-pane>\n    <ion-content overflow-scroll=\"true\">\n      <ion-list>\n        <ion-item ng-show=\"vm.roteiros.length===0\" class=\"item item-icon-right item-card\">\n          <div class=\"card\">\n            Não há roteiros disponíveis.\n          </div>\n        </ion-item>\n        <ion-item ng-show=\"!vm.tracker.loading.tracking()\"\n                  collection-repeat=\"roteiro in vm.roteiros\" class=\"item item-icon-right item-card\"\n                  item=\"roteiro\"\n                  item-width=\"100%\"\n                  item-height=\"55px\"\n                  ng-click=\"vm.selectItem(roteiro, $event)\">\n          <div class=\"card\">\n            <div class=\"item item-text-wrap\" ng-class=\"{\'item-positive\': roteiro.codigo === vm.itemSelected.codigo && vm.itemSelected, \'item-stable\': !vm.itemSelected && roteiro.codigo !== vm.itemSelected.codigo}\">\n              {{roteiro.nome}} - {{roteiro.saida | momentToHour}} - {{roteiro.destino}}\n              <done-icon ng-if=\"!!roteiro.selected\"></done-icon>\n            </div>\n          </div>\n        </ion-item>\n        <ion-item ng-show=\"vm.tracker.loading.tracking()\"\n                  item-width=\"100%\"\n                  item-height=\"55px\">\n          <div class=\"card\">\n            <div class=\"item item-text-wrap item-stable\">\n              Carregando lista\n            </div>\n          </div>\n        </ion-item>\n\n        <ion-infinite-scroll\n          ng-if=\"vm.canLoad\"\n          icon=\"ion-loading-c\"\n          on-infinite=\"vm.loadMoreData()\"\n          distance=\"1%\">\n        </ion-infinite-scroll>\n      </ion-list>\n    </ion-content>\n    <ion-footer-bar style=\"height: 12%\" class=\"silver\">\n      <div class=\"col col-50\">\n        <button class=\"button button-full button-large button-stable ink\" ng-click=\"vm.comeBack()\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <back-icon></back-icon>\n          <span>Voltar!</span>\n        </button>\n      </div>\n      <div class=\"col col-50\">\n        <button ng-show=\"!!vm.itemSelected\" class=\"button button-full button-large button-stable ink\" ng-click=\"vm.nextStep()\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <next-icon ng-hide=\"vm.onlySelection\"></next-icon>\n          <span ng-hide=\"vm.onlySelection\">Avançar!</span>\n          <done-icon ng-show=\"vm.onlySelection\"></done-icon>\n          <span ng-show=\"vm.onlySelection\">OK!</span>\n        </button>\n        <button ng-show=\"!vm.itemSelected\" class=\"button button-full button-large button-stable ink\" ng-click=\"vm.nextStep()\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <done-icon ng-show=\"vm.onlySelection\"></done-icon>\n          <span ng-show=\"vm.onlySelection\">{{vm.label}}</span>\n        </button>\n      </div>\n    </ion-footer-bar>\n  </ion-pane>\n</ion-view>\n");
$templateCache.put("main/usuario/veiculo/select-veiculo.html","<ion-view title=\"Selecionado Veículo\">\n  <ion-pane>\n    <ion-header-bar class=\"bar-subheader sub-header\">\n      <div class=\"row item-input-inset\">\n        <div class=\"col col-50\">\n          <label class=\"item-input-wrapper\">\n            <i class=\"icon ion-ios-search placeholder-icon\"></i>\n            <input type=\"search\" placeholder=\"Buscar Veículo\" ng-model=\"vm.busca\">\n            <clear-icon ng-show=\"vm.busca\" ng-click=\"vm.clear(\'busca\');\"></clear-icon>\n          </label>\n        </div>\n        <div class=\"col col-33\">\n          <button class=\"button button-energized\"style=\"width: 100px\" ng-click=\"vm.search($event)\">\n            <b>Buscar</b>\n          </button>\n        </div>\n      </div>\n    </ion-header-bar>\n    <ion-content class=\"ion-content\" overflow-scroll=\"true\">\n      <ion-list>\n        <ion-item ng-show=\"!vm.tracker.loading.tracking()\"\n                  collection-repeat=\"veiculo in vm.veiculos\" class=\"item item-icon-right item-card\"\n                  item=\"veiculo\"\n                  item-width=\"100%\"\n                  item-height=\"55px\"\n                  ng-click=\"vm.selectItem(veiculo, $event)\">\n          <div class=\"card\">\n            <div class=\"item item-text-wrap\" ng-class=\"{\'item-positive\': veiculo.codigo === vm.itemSelected.codigo && vm.itemSelected, \'item-stable\': !vm.itemSelected && veiculo.codigo !== vm.itemSelected.codigo}\">\n              {{veiculo.descricao+\' - \'+veiculo.placa}}\n              <done-icon ng-if=\"!!veiculo.selected\"></done-icon>\n            </div>\n          </div>\n        </ion-item>\n        <ion-item ng-show=\"vm.tracker.loading.tracking()\"\n                  item-width=\"100%\"\n                  item-height=\"55px\">\n          <div class=\"card\">\n            <div class=\"item item-text-wrap item-stable\">\n              Carregando lista\n            </div>\n          </div>\n        </ion-item>\n\n        <ion-infinite-scroll\n          ng-if=\"vm.canLoad\"\n          icon=\"ion-loading-c\"\n          on-infinite=\"vm.loadMoreData()\"\n          distance=\"1%\">\n        </ion-infinite-scroll>\n      </ion-list>\n    </ion-content>\n    <ion-footer-bar ng-show=\"!!vm.itemSelected\" style=\"height: 12%\" class=\"silver\">\n      <div class=\"col col-50\">\n        <button class=\"button button-full button-large button-stable ink\" ng-click=\"vm.comeBack()\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <back-icon></back-icon>\n          <span>Voltar!</span>\n        </button>\n      </div>\n      <div class=\"col col-50\">\n        <button class=\"button button-full button-large button-stable ink\" ng-click=\"vm.nextStep()\" style=\"padding: 0; width: 100%; min-height: 45px\">\n          <next-icon ng-hide=\"vm.onlySelection\"></next-icon>\n          <span ng-hide=\"vm.onlySelection\">Avançar!</span>\n          <done-icon ng-show=\"vm.onlySelection\"></done-icon>\n          <span ng-show=\"vm.onlySelection\">OK!</span>\n        </button>\n      </div>\n    </ion-footer-bar>\n  </ion-pane>\n</ion-view>\n");
$templateCache.put("main/viagem/directives/km-final.template.html","<div class=\"km-input\" ng-class=\"{ \'has-error\' : kmForm.kmFinal.$invalid && (!kmForm.kmFinal.$pristine || kmForm.$submitted)}\">\n  <input id=\"kmFinal\" type=\"number\" name=\"kmFinal\" ng-model=\"vm.model\" ng-change=\"vm.refreshModel()\" min=\"0\" ck-required>\n   <div class=\"form-error\" ng-if=\"kmForm.kmFinal.$invalid && (!kmForm.kmFinal.$pristine || kmForm.$submitted)\">Preencha o campo KM Final.</div>\n   <div class=\"form-error\" ng-if=\"kmForm.kmInicial < kmForm.kmFinal\">O KM Final não pode ser menor que o KM Inicial</div>\n</div>\n");
$templateCache.put("main/viagem/directives/km-inicial.template.html","<div class=\"km-input\" ng-class=\"{ \'has-error\' : kmForm.kmInicial.$invalid && (!kmForm.kmInicial.$pristine || kmForm.$submitted)}\">\n  <input id=\"kmInicial\" ng-if=\"kmFinal\" type=\"number\" name=\"kmInicial\" ng-model=\"vm.model\" ng-change=\"vm.refreshModel()\" min=\"0\" ck-required ui >\n  <input id=\"kmInicial\" ng-if=\"!kmFinal\" type=\"number\" name=\"kmInicial\" ng-model=\"vm.model\" ng-change=\"vm.refreshModel()\" min=\"0\" ck-required>\n   <div class=\"form-error\" ng-if=\"kmForm.kmInicial.$invalid && (!kmForm.kmInicial.$pristine || kmForm.$submitted)\">Preencha o campo KM Inicial.</div>\n   <div class=\"form-error\" ng-if=\"kmForm.kmInicial < kmForm.kmFinal\">O KM Inicial não pode ser maior que o KM Final</div>\n</div>\n");
$templateCache.put("main/viagem/emviagem/encerrar-viagem.html","<ion-view title=\"Encerrando Viagem\">\n    <ion-content>\n        <div class=\"list\" style=\"margin-bottom: 1px;\">\n            <div class=\"card light-bg padding\">\n                <div class=\"row padding-vertical-zero\">\n                    <div class=\"col\">\n                        <div class=\"row padding-vertical-zero\">\n                            <h3>Destino: {{vm.viagem.destino.descricao}}</h3>\n                        </div>\n                        <div class=\"row padding-vertical-zero\">\n                            <div class=\"col col-50 padding-vertical-zero\">\n                                <div class=\"row\">\n                                    <h4>Motorista: {{vm.viagem.motorista.nome}}</h4>\n                                    <div class=\"padding-left\">\n                                        <button class=\"button button-fab button-small button-calm\" ng-click=\"vm.goSelectMotorista()\">\n                                            <driver-icon></driver-icon>\n                                        </button>\n                                    </div>\n                                </div>\n                            </div>\n                            <div class=\"col col-50 padding-vertical-zero\">\n                                <div class=\"row\">\n                                    <h4>Veículo: {{vm.viagem.veiculo.descricao}}</h4>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <div class=\"row padding-vertical-zero\">\n                    <div class=\"col col-25\">\n                        <div class=\"card\">\n                            <div class=\"item item-card item-divider\" style=\"text-align: center\">\n                                <h2 class=\"text-item-middle\">Saída</h2>\n                            </div>\n                            <div class=\"item item-card item-text-wrap\">\n                                <div class=\"row card-encerramento card-row padding-vertical-zero\">\n                                    <div class=\"col col-75 padding-left padding-vertical-zero\">\n                                        <h2 class=\"text-item-middle text-item-body\">{{vm.viagem.saida| momentToDate}}</h2>\n                                    </div>\n                                    <div class=\"col col-25 padding-vertical-zero\">\n                                      <ck-button-date ng-model=\"vm.viagem.saida\" listener=\"vm.saidaListener\"><calendar-icon></calendar-icon></ck-button-date>\n                                    </div>\n                                </div>\n                                <div class=\"row card-encerramento card-row padding-vertical-zero\">\n                                    <div class=\"col col-75 padding-left padding-vertical-zero\">\n                                        <h2 class=\"text-item-middle text-item-body\">{{vm.viagem.saida| momentToTime}}</h2>\n                                    </div>\n                                    <div class=\"col col-25 padding-vertical-zero\">\n                                        <ck-button-time ng-model=\"vm.viagem.saida\" listener=\"vm.saidaListener\"><clock-icon></clock-icon></ck-button-time>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    <div class=\"col col-offset-10 col-25\">\n                        <div class=\"card\">\n                            <div class=\"item item-card item-divider\" style=\"text-align: center\">\n                                <h2 class=\"text-item-middle\">Chegada</h2>\n                            </div>\n                            <div class=\"item item-card item-text-wrap item-icon-right\">\n                                <div class=\"row padding-vertical-zero card-row\" >\n                                    <div class=\"col col-75 padding-left padding-vertical-zero\">\n                                        <h2 class=\"text-item-middle text-item-body\">{{vm.viagem.chegada| momentToDate}}</h2>\n                                    </div>\n                                    <div class=\"col col-25 padding-vertical-zero\">\n                                        <ck-button-date ng-model=\"vm.viagem.chegada\" listener=\"vm.chegadaListener\"><calendar-icon></calendar-icon></ck-button-date>\n                                    </div>\n                                </div>\n                                <div class=\"row padding-vertical-zero card-row\" >\n                                    <div class=\"col col-75 padding-left padding-vertical-zero\">\n                                        <h2 class=\"text-item-middle text-item-body\">{{vm.viagem.chegada| momentToTime}}</h2>\n                                    </div>\n                                    <div class=\"col col-25 padding-vertical-zero\">\n                                        <ck-button-time ng-model=\"vm.viagem.chegada\" listener=\"vm.chegadaListener\"><clock-icon></clock-icon></ck-button-time>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    <div class=\"col col-offset-8 col-33\" style=\"top: -8px\">\n                      <listapassageiro readOnly=\"true\" size=\"4\" label=\"Passageiros\"></listapassageiro>\n                      <listapassageiro readOnly=\"false\" size=\"4\" label=\"Presença\"></listapassageiro>\n                    </div>\n                </div>\n\n                <form name=\"vm.form\">\n                    <div class=\"card\">\n                        <div class=\"item block-form-card\" style=\"padding-top: 5px; padding-bottom: 5px;\">\n                            <label class=\"row padding-vertical-zero item item-input item-stacked-label\" data-tap-disabled=\"true\">\n                                <div class=\"col col-33 item-stacked-label\">\n                                    <span class=\"input-label\">KM Inicial:</span>\n                                    <input-km-inicial ng-model=\"vm.viagem.kmInicial\" km-final=\"vm.viagem.kmFinal\" km-form=\"vm.form\"></input-km-inicial>\n                                </div>\n                                <div class=\"col col-33 item-stacked-label\">\n                                    <span class=\"input-label\">KM Final:</span>\n                                    <input-km-final ng-model=\"vm.viagem.kmFinal\" km-inicial=\"vm.viagem.kmInicial\" km-form=\"vm.form\"></input-km-final>\n                                    <div class=\"form-error\" ng-if=\"vm.erroKmFinal\" ng-message=\"ck-required\">{{vm.erroKmFinal}}</div>\n                                </div>\n                                <div class=\"col col-33 item-stacked-label\">\n                                    <span class=\"input-label\">Distância percorrida (km):</span>\n                                    <input type=\"number\" ng-disabled=\"true\" ng-model=\"vm.distanciaPercorrida\">\n                                </div>\n                            </label>\n                            <label class=\"row padding-vertical-zero item item-input item-stacked-label\">\n                                <div class=\"col\">\n                                    <span class=\"input-label\">Observação:</span>\n                                    <textarea rows=\"3\" name=\"obsViagem\" cols=\"100\" ng-model=\"vm.viagem.observacao\" ck-max-length=\"512\"></textarea>\n                                </div>\n                            </label>\n                        </div>\n                    </div>\n                </form>\n            </div>\n        </div>\n\n        <div class=\"padding-left padding-right\">\n            <button class=\"button button-full button-large button-assertive ink\" ng-click=\"vm.finalizarEncerramento()\">\n                <done-icon></done-icon>\n                Finalizar!\n            </button>\n        </div>\n    </ion-content>\n</ion-view>\n");
$templateCache.put("main/viagem/emviagem/nova-viagem.html","<ion-view title=\"Nova Viagem\">\n\n  <ion-content>\n    <div class=\"row\">\n      <div class=\"col\">\n        <div class=\"list\">\n          <div class=\"row\">\n            <div class=\"col col-50\">\n              <div class=\"card\">\n                <div class=\"item item-card item-divider\" style=\"text-align: center\">\n                  <h2 class=\"text-item-middle\">Dados da Condução</h2>\n                </div>\n                <div class=\"row\" ng-click=\"vm.goSelectMotorista()\">\n                  <div class=\"col col-80 text-vertical-middle\" ><h4>Motorista: {{vm.viagem.motorista.nome}}</h4></div>\n                  <div class=\"col col-20 button-block-vertical padding-left\">\n                    <button class=\"button button-fab button-small button-calm\" ng-click=\"vm.goSelectMotorista()\">\n                      <driver-icon></driver-icon>\n                    </button>\n                  </div>\n                </div>\n                <div class=\"row\" ng-click=\"vm.goSelectVeiculo()\" >\n                  <div class=\"col col-80 text-vertical-middle\">\n                    <h4>Veículo: {{vm.viagem.veiculo.descricao}}</h4>\n                  </div>\n                  <div class=\"col col-20 button-block-vertical padding-left\">\n                    <button class=\"button button-fab button-small button-calm\" ng-click=\"vm.goSelectVeiculo()\">\n                      <car-icon></car-icon>\n                    </button>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <div class=\"col col-80 text-vertical-middle\">\n                    <h4>Destino: {{vm.viagem.destino.descricao}}</h4>\n                  </div>\n                  <div class=\"col col-20 button-block-vertical padding-left\">\n                    <button class=\"button button-fab button-small button-calm\" ng-click=\"vm.goCidade()\">\n                      <city-icon></city-icon>\n                    </button>\n                  </div>\n                  <div ng-messages=\"vm.form.destino.$error\" role=\"alert\" ng-show=\"!vm.form.destino.$pristine || vm.form.$submitted\">\n                    <div class=\"form-error\" ng-message=\"ck-required\">Preencha o campo \"Destino\"</div>\n                  </div>\n                </div>\n\n              </div>\n            </div>\n            <div class=\"col col-offset-10 col-33\">\n              <div class=\"card\">\n                <div class=\"item item-card item-divider\" style=\"text-align: center\">\n                  <h2 class=\"text-item-middle\">Saída</h2>\n                </div>\n                <div class=\"row\">\n                  <div class=\"col col-80 text-vertical-middle\"><h4>{{vm.viagem.saida | momentToDate}}</h4></div>\n                  <div class=\"col col-20 button-block-vertical\">\n                    <ck-button-date ng-model=\"vm.viagem.saida\" listener=\"vm.saidaListener\"><calendar-icon></calendar-icon></ck-button-date>\n                  </div>\n                </div>\n                <div class=\"row\">\n                  <div class=\"col col-80 text-vertical-middle\">\n                    <h4>{{vm.viagem.saida | momentToTime}}</h4>\n                  </div>\n                  <div class=\"col col-20 button-block-vertical\">\n                    <ck-button-time ng-model=\"vm.viagem.saida\" listener=\"vm.saidaListener\"><clock-icon></clock-icon></ck-button-time>\n                  </div>\n                </div>\n                  <listapassageiro readOnly=\"true\" class=\"col-33\" size=\"4\" label=\"Passageiros\"></listapassageiro>\n                  <listapassageiro readOnly=\"false\" class=\"col-33\" size=\"4\" label=\"Presença\"></listapassageiro>\n              </div>\n            </div>\n          </div>\n\n          <div class=\"card stable-bg\">\n            <form name=\"vm.form\">\n              <div class=\"row\">\n                <div class=\"col col-33\">\n                  <label class=\"item item-input item-stacked-label padding-left padding-right\" ng-class=\"{ \'has-error\' : vm.form.kmInicial.$invalid && (!vm.form.kmInicial.$pristine || vm.form.$submitted)}\">\n                    <span class=\"input-label\">KM Inicial:</span>\n                    <input ng-model=\"vm.viagem.kmInicial\" style=\"display:block; height: 32px;\" ng-init=\"vm.initKm()\" ></input>\n                  </label>\n                </div>\n                <div class =\"col col-33\">\n                  <label class=\"item item-input item-stacked-label padding-left padding-right\" ng-class=\"{ \'has-error\' : vm.form.localSaida.$invalid && (!vm.form.localSaida.$pristine || vm.form.$submitted)}\">\n                      <span class=\"input-label\">Local de Saída:</span>\n                      <input required=\"required\" name=\"localSaida\" style=\"display:block; height: 32px;\" ng-model=\"vm.viagem.localSaida\" />\n                      <div role=\"alert\">\n                        <div class=\"form-error\" ng-if=\"vm.form.localSaida.$invalid && (!vm.form.localSaida.$pristine || vm.form.$submitted)\">Preencha o campo \"Local de Saída\"</div>\n                      </div>\n                  </label>\n                </div>\n              </div>\n            </form>\n          </div>\n        </div>\n\n        <div class=\"row\">\n          <button class=\"button button-block button-large button-assertive ink\" ng-click=\"vm.iniciaViagem()\">\n            <play-icon></play-icon>\n            Iniciar Viagem!\n          </button>\n        </div>\n\n      </div>\n    </div>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("main/viagem/emviagem/viajando.html","<ion-view title=\"Em viagem\">\n  <ion-content>\n    <div class=\"col\">\n      <div class=\"list\">\n        <div class=\"card light-bg padding\">\n          <div class=\"row\">\n            <div class=\"col-50\">\n              <div class=\"card\">\n                <div class=\"row\">\n                  <div class=\"col col-80 text-vertical-middle\"><h3>Data de Saída: {{vm.viagem.saida | momentToDate}}</h3></div>\n                  <div class=\"col col-20 button-block-vertical\">\n                    <ck-button-date ng-model=\"vm.viagem.saida\" on-tap=\"vm.refreshSaida\" listener=\"vm.saidaListener\"><calendar-icon></calendar-icon></ck-button-date>\n                  </div>\n                </div>\n                <div class=\"row padding-top\">\n                  <div class=\"col col-80 text-vertical-middle\"><h3>Horário de Saída: {{vm.viagem.saida | momentToTime}}</h3></div>\n                  <div class=\"col col-20 button-block-vertical\">\n                    <ck-button-time ng-model=\"vm.viagem.saida\" on-tap=\"vm.refreshSaida\" listener=\"vm.saidaListener\"><clock-icon></clock-icon></ck-button-time>\n                  </div>\n                </div>\n                <div class=\"row padding-top\">\n                  <div class=\"col col-80 text-vertical-middle\"><h3>Motorista: {{vm.viagem.motorista.nome}}</h3></div>\n                  <div class=\"col col-20 button-block-vertical\">\n                    <button class=\"button button-fab button-small button-calm\" ng-click=\"vm.goSelectMotorista()\">\n                      <driver-icon></driver-icon>\n                    </button>\n                  </div>\n                </div>\n                <div class=\"row padding-top\">\n                  <div class=\"col col-80 text-vertical-middle\"><h3>Veículo: {{vm.viagem.veiculo.descricao}}</h3></div>\n                  <div class=\"col col-20 button-block-vertical\">\n                    <button class=\"button button-fab button-small button-calm\">\n                      <car-icon></car-icon>\n                    </button>\n                  </div>\n                </div>\n                  <listapassageiro readOnly=\"true\" class=\"col-33\" size=\"3\" label=\"Passageiros\"></listapassageiro>\n                  <listapassageiro readOnly=\"false\" class=\"col-33\" size=\"3\" label=\"Presença\"></listapassageiro>\n              </div>\n            </div>\n            <div class=\"col-offset-10 col-33 text-center\">\n              <div class=\"card block-form-card padding\">\n                <div class=\"padding-left padding-top padding-right\"><h2>Tempo de Viagem</h2></div>\n                <div class=\"card timer-card\">\n                  <h1 class=\"time-travel padding\">\n                    <timer start-time=\"vm.initTempoViagem\">{{hhours}}:{{mminutes}}</timer>\n                  </h1>\n                </div>\n              </div>\n              <div class=\"row padding-right padding-left\">\n                <div class=\"col text-center\">\n                  <h2>Destino: {{vm.viagem.destino.descricao}}</h2>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"row padding-left padding-right\">\n      <button class=\"button button-full button-large button-assertive ink\" ng-click=\"vm.encerrar()\">\n        <finish-travel-icon></finish-travel-icon>\n        Encerrar Viagem!\n      </button>\n    </div>\n\n  </ion-content>\n</ion-view>\n");}]);
'use strict';

(function () {
    angular.module('app.sincronizacao', ['restangular']);
})();

'use strict';

(function () {
  angular.module('app.sincronizacao')
  .controller('SincronizarCtrl', SincronizarCtrl);

  SincronizarCtrl.$inject = ['$injector', '$log', '$state', '$jsSHA', 'promiseTracker', '$localStorage'];

  function SincronizarCtrl($injector, $log, $state, $jsSHA, promiseTracker, $localStorage) {
    var vm = this;
    var IntegracaoService = $injector.get('IntegracaoService');
    var popup = $injector.get('popup');
    var passwordValid = true;

    if(window.localStorage.url){
      var url = window.localStorage.url;
      vm.url = url;
    }else{
      $state.goNoHistory('app.configuracao');
    }

    vm.sincronizar = sincronizar;
    vm.usuario = {};

    if (window.localStorage.usuario &&  window.localStorage.senha) {
      vm.usuario.login =  window.localStorage.usuario;
      vm.usuario.senha =  window.localStorage.senha;
    }else{
        $state.goNoHistory('app.configuracao');
    }

    vm.tracker = {};
    vm.tracker.connecting = promiseTracker();

    vm.passwordIsValid = function () {
      return passwordValid;
    };

    function sincronizar() {
      vm.form.$setSubmitted(true);
      if (vm.form.$valid) {
        if (vm.url) {
          IntegracaoService.setBaseUrl(vm.url);

          var user = angular.copy(vm.usuario);
          user.senha = $jsSHA.criptografar(vm.usuario.senha);

          vm.tracker.connecting.addPromise(
            IntegracaoService.validateUser(user).then(function (result) {
              if (result && result.codigo) {
                if (result.codeDetail) {
                  popup.error(result.codeDetai);
                }
                $localStorage.setUsuarioSync($localStorage.getUsuario());
                $localStorage.setUsuario(result);
                $log.log('Iniciando sincronização.');
                $state.goNoHistory('app.sincronizando');
              } else {
                popup.error('Usuário ou senha inválido ou profissional não vinculado ao usuário, acesse as configurações para alterar.');
              }
            }, function (result) {
              if (result.status <= 0) {
                popup.error('A URL requisitada (' + vm.url + ') não existe ou é inválida, verifique o campo informado ou a conexão com a internet.');
              }else if(result.status === 406){

                popup.error('(' + result.headers['codeError'] + ') ' + result.headers['codeMessage'])
              }
            })
          );
        }
      }
    }
  }

})();

'use strict';

(function() {
  angular.module('app.sincronizacao')
    .controller('SincronizandoCtrl', SincronizandoCtrl);

  SincronizandoCtrl.$inject = ['$scope', '$state', '$injector', '$log', '$localStorage', '$moment', '$rootScope', '$ionicScrollDelegate'];

  function SincronizandoCtrl($scope, $state, $injector, $log, $localStorage, $moment, $rootScope, $ionicScrollDelegate) {
    var vm = this;
    var CreateDatabase = $injector.get('CreateDatabase');
    var IntegracaoService = $injector.get('IntegracaoService');
    var InitConfigService = $injector.get('InitConfigService');

    vm.logSincronizacao = [];

    vm.goHome = goHome;

    function myLogger(message, type) {
      return {
        mensagem: message,
        success: !!type && !!type.success,
        error: !!type && !!type.error
      };
    }

    init();

    function init() {
      vm.successful = false;
    }

    function error(message) {
      $localStorage.setUsuario($localStorage.getUsuarioSync());
      return function(erro) {
        if (message) {
          if (erro.headers) {
            vm.logSincronizacao.push(myLogger(message + ': ' + erro.headers('codeDetail'), {
              error: true
            }));
          } else {
            vm.logSincronizacao.push(myLogger(message + ': ' + erro, {
              error: true
            }));
          }
          $ionicScrollDelegate.scrollBottom();
        }
        $log.error(erro);
        vm.successful = false;
      };
    }

    $scope.$on('ADD::LOG::SINCRONIZACAO', function(event, message) {
      vm.logSincronizacao.push(message);
    });

    CreateDatabase.init().then(function() {
      $log.log('Base de dados atualizada com sucesso.');


      IntegracaoService.enviarViagens().then(function() {

        vm.logSincronizacao.push(myLogger('Viagens enviadas com sucesso'));
        $log.log('Viagens enviadas com sucesso');
        $ionicScrollDelegate.scrollBottom();
        IntegracaoService.enviarPassageiros().then(function() {
            vm.logSincronizacao.push(myLogger('Passageiros enviados com sucesso'));
          IntegracaoService.enviarPontosViagens().then(function() {
            vm.logSincronizacao.push(myLogger('Rotas enviadas com sucesso'));
            $log.log('Rotas enviadas com sucesso');
            $ionicScrollDelegate.scrollBottom();

            IntegracaoService.buscarDadosCadastrais().then(function() {

              $log.log('Dados cadastrais carregados em memoria');
              $ionicScrollDelegate.scrollBottom();
              IntegracaoService.limparDadosCadastrais().then(function() {

                vm.logSincronizacao.push(myLogger('Dados cadastrais removidos com sucesso'));
                $log.log('Dados cadastrais removidos com sucesso');
                $ionicScrollDelegate.scrollBottom();
                IntegracaoService.importarDadosCadastrais().then(function() {

                  vm.logSincronizacao.push(myLogger('Dados cadastrais importados com sucesso'));
                  $log.log('Dados cadastrais importados com sucesso.');
                  $ionicScrollDelegate.scrollBottom();
                  IntegracaoService.limparRotas().then(function() {
                    IntegracaoService.limparViagens().then(function() {
                      vm.logSincronizacao.push(myLogger('Sincronização realizada com sucesso', {
                        success: true
                      }));

                      $localStorage.setHorario($moment());
                      $localStorage.setDatabaseCreated({
                        created: true
                      });

                      $localStorage.setUsuario($localStorage.getUsuarioSync());

                      InitConfigService.setConfigInitApp({
                        sincronized: true
                      });
                      $ionicScrollDelegate.scrollBottom();
                      vm.successful = true;
                    }, error('Erro ao limpar as viagens.'));
                  }, error());
                }, error('Erro ao importar os dados cadastrais'));
              }, error('Erro ao remover os dados cadastrais'));
            }, error());
          }, error(' Erro ao enviar as rotas das viagens'));
        }, error(' Erro ao enviar os passageiros das viagens'));
      }, error('Erro ao enviar as viagens'));
    }, error('Error ao atualizar a estrutura da base de dados'));

    function goHome() {
      // $localStorage.setUsuario($localStorage.getUsuarioSync())
      if (vm.successful) {
        $rootScope.$broadcast('DB:OK', true);
      }
      $state.goNoHistory('app.inicio');
    }
  }

})();

'use strict';

(function () {
    angular.module('app.sincronizacao')
        .config(Sincronizando);

    function Sincronizando(RestangularProvider) {
      RestangularProvider.setDefaultHeaders({ 'Content-Type': 'application/json' });
    }
})();

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

'use strict';

(function () {
    angular.module('main')
        .run(mainRun);

    mainRun.$inject = ['$state', '$ionicHistory', 'LoginEventEmitter'];

    function mainRun($state, $ionicHistory, LoginEventEmitter) {
      $state.goNoHistory = goNoHistory;
      $state.goIfSessionValid = goIfSessionValid;
      $state.goIfSessionValidNoHistory = goIfSessionValidNoHistory;

      function goNoHistory(to){
        $ionicHistory.nextViewOptions({
          disableBack: true
        });

        $state.go(to);
      }

      function goIfSessionValid(to){
        LoginEventEmitter.onStateGo().then(function(valid){
          if(valid){
            $state.go(to);
          }
        });
      }

      function goIfSessionValidNoHistory(to){
        LoginEventEmitter.onStateGo().then(function(valid){
          if(valid){
            $state.goNoHistory(to);
          }
        });
      }

    }
})();

'use strict';

(function() {
  angular.module('main')
    .config(mainConfig)
    .value('EstadoViagem', {
      novaViagem: true,
      viajando: false,
      encerrando: false
    });

  function mainConfig(TablesProvider, DatabaseProvider, $localStorageProvider) {

    TablesProvider.setStructure(new StructureTables());

    DatabaseProvider.setNameDatabase('diariodebordo.db');

    $localStorageProvider.setStorage(new MyLocalStorage());
  }

  function StructureTables() {
    var TABLES = this;

    TABLES.COLS = {};
    TABLES.FKS = {};

    TABLES.COLS.motoristas = {
      codigo: 'INTEGER PRIMARY KEY',
      nome: 'VARCHAR(50) NOT NULL',
      dataNascimento: 'VARCHAR(10)',
      profissional: 'INTEGER NOT NULL'
    };

    TABLES.COLS.usuarios = {
      codigo: 'INTEGER PRIMARY KEY',
      cpf: 'VARCHAR(11)',
      email: 'VARCHAR(50)',
      login: 'VARCHAR(100) NOT NULL',
      nome: 'VARCHAR(50) NOT NULL',
      profissional: 'INTEGER NOT NULL',
      senha: 'VARCHAR(2147483647) NOT NULL',
      codigoCidade: 'VARCHAR(250) NOT NULL'
    };

    TABLES.COLS.veiculos = {
      codigo: 'INTEGER PRIMARY KEY',
      descricao: 'VARCHAR(50) NOT NULL',
      placa: 'VARCHAR(10)',
      fabricante: 'VARCHAR(30)',
      km: 'VARCHAR',
      keyword: 'VARCHAR(200)'
    };

    TABLES.COLS.viagens = {
      codigo: 'INTEGER PRIMARY KEY AUTOINCREMENT',
      codigoRoteiro: 'INTEGER',
      veiculo: 'INTEGER NOT NULL',
      motorista: 'INTEGER NOT NULL',
      usuario: 'INTEGER NOT NULL',
      saida: 'VARCHAR(35) NOT NULL',
      chegada: 'VARCHAR(35) NOT NULL',
      destino: 'VARCHAR(50) NOT NULL',
      localSaida: 'VARCHAR(200)',
      kmInicial: 'INTEGER NOT NULL',
      kmFinal: 'INTEGER NOT NULL',
      observacao: 'VARCHAR(512)',
      dataCadastro: 'VARCHAR(35) NOT NULL',
      nomeDestino: 'VARCHAR(200)',
      keyword: 'VARCHAR(200)'
    };

    TABLES.COLS.viagens_pontos_trajeto = {
      codigo: 'INTEGER PRIMARY KEY AUTOINCREMENT',
      latitude: 'VARCHAR(50)',
      longitude: 'VARCHAR(50)',
      velocidade: 'VARCHAR(50)',
      motorista: 'VARCHAR(100) NOT NULL',
      veiculo: 'VARCHAR(100) NOT NULL',
      usuario: 'INTEGER NOT NULL',
      codigoViagem: 'INTEGER NOT NULL',
      dataDoRegistro: 'VARCHAR(35) NOT NULL'
    };

    //Roteiro
    TABLES.COLS.roteiroViagem = {
      codigo: 'INTEGER PRIMARY KEY',
      codigoVeiculo: 'INTEGER',
      codigoMotorista: 'INTEGER',
      codigoCidade: 'INTEGER',
      localSaida: 'VARCHAR(250)',
      saida: 'VARCHAR(35)',
      chegada: 'VARCHAR(35)'

    };

    TABLES.COLS.roteiroPassageiro = {
      codigo: 'INTEGER PRIMARY KEY',
      codigoRoteiro: 'INTEGER',
      codigoUsuario: 'INTEGER',
      nomeUsuario: 'VARCHAR(200)',
      destino: 'VARCHAR(100)',
      observacao: 'VARCHAR(1024)',
      horario: 'VARCHAR(35)',
      codigoUsuarioFalta: 'INTEGER',
      localEmbarque: 'VARCHAR(100)',
      tpViagem: 'VARCHAR(15)',
      codigoSolicitacao: 'INTEGER',
      status: 'INTEGER',
      descricaoStatus: 'VARCHAR(15)',
      codigoUsuarioRegistro: 'INTEGER',
      changed: 'VARCHAR(6)',
      telefone: 'VARCHAR(15)'
    };

    TABLES.COLS.cidade = {
      codigo: 'INTEGER PRIMARY KEY',
      descricao: 'VARCHAR(200)'
    };

  }

  function MyLocalStorage() {
    var self = this;

    self.USUARIO = {
      name: 'USER_LOGGED',
      type: 'object'
    };
    self.USUARIO_SYNC = {
      name: 'USER_SYNC',
      type: 'object'
    };
    self.VEICULO = {
      name: 'AUTOMOBILE_SELECTED',
      type: 'object'
    };
    self.HORARIO = {
      name: 'TIME_LOGGED',
      type: 'moment'
    };
    self.DATABASE_CREATED = {
      name: 'DATABASE_CREATED',
      type: 'object'
    };
    self.VIAGEM = {
      name: 'TRAVEL',
      type: 'object'
    };
    self.LAST_VIAGEM = {
      name: 'LAST_VIAGEM',
      type: 'object'
    };
    self.SESSAO = {
      name: 'SESSION',
      type: 'number'
    };
    self.ESTADO_VIAGEM = {
      name: 'ESTADO_VIAGEM',
      type: 'object'
    };
    self.PONTOS_GPS = {
      name: 'PONTOS_GPS',
      type: 'object'
    };
    self.CIDADE = {
      name: 'CIDADE',
      type: 'object'
    };
    self.ROTEIRO = {
      name: 'ROTEIRO',
      type: 'object'
    };
    self.ROTEIRO_M = {
      name: 'ROTEIRO_M',
      type: 'object'
    };
    self.MOTORISTA = {
      name: 'MOTORISTA',
      type: 'object'
    };

    self.READ_ONLY_PASSAGEIROS ={
      name: 'ReadOnlyPassageiros',
      type: 'object'
    }

    self.DATA_SAIDA ={
      name:'DATA_SAIDA',
      type:'moment'
    }

    self.DATA_CHEGADA ={
      name: 'DATA_CHEGADA',
      type: 'moment'
    }
    self.VIAGEM_TO_EDIT={
      name:'VIAGEM_TO_EDIT',
      type: 'object'
    }
    self.CIDADE_PADRAO={
      name:'CIDADE_PADRAO',
      type: 'object'
    }
  }
})();

'use strict';

(function () {
    angular.module('material-design-icons', []);
})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .factory('MaterialIconsFactory', MaterialIconsFactory);

    MaterialIconsFactory.$inject = ['TEMPLATE_ICONS'];

    function MaterialIconsFactory(TEMPLATE_ICONS) {
        var self = this;

        self.generateByName = generateByName;

        function generateByName(name){
          if(typeof name !== 'string'){
            throw Error('Invalid parameter name!');
          }

          return new Icon(name);
        }

        function Icon(name){
          this.template = buildTemplate(name);

          this.scope = {};
          this.scope.class = '@';
        }

        function buildTemplate(name){
          var TAG_OPEN = '<i class="material-icons {{class}}" style="vertical-align: middle; display: inline-block;">',
            TAG_CLOSE = '</i>';

          var template = TEMPLATE_ICONS[name.toUpperCase()];

          if(!template){
            throw Error('Icon name invalid!');
          }

          return TAG_OPEN.concat(template).concat(TAG_CLOSE);
        }

        return self;
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('userIcon', userIcon);

    userIcon.$inject = ['MaterialIconsFactory'];

    function userIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('user');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('travelsIcon', travelsIcon);

    travelsIcon.$inject = ['MaterialIconsFactory'];

    function travelsIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('travels');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('travelingIcon', travelingIcon);

    travelingIcon.$inject = ['MaterialIconsFactory'];

    function travelingIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('traveling');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('synchronizeIcon', synchronizeIcon);

    synchronizeIcon.$inject = ['MaterialIconsFactory'];

    function synchronizeIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('synchronize');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('saveIcon', saveIcon);

    saveIcon.$inject = ['MaterialIconsFactory'];

    function saveIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('save');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('plusIcon', plusIcon);

    plusIcon.$inject = ['MaterialIconsFactory'];

    function plusIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('plus');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('playIcon', playIcon);

    playIcon.$inject = ['MaterialIconsFactory'];

    function playIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('play');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('peopleIcon', peopleIcon);

    peopleIcon.$inject = ['MaterialIconsFactory'];

    function peopleIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('people');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('nextIcon', nextIcon);

    nextIcon.$inject = ['MaterialIconsFactory'];

    function nextIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('next');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('newTravelIcon', newTravelIcon);

    newTravelIcon.$inject = ['MaterialIconsFactory'];

    function newTravelIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('newtravel');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('homeIcon', homeIcon);

    homeIcon.$inject = ['MaterialIconsFactory'];

    function homeIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('calendar');
    }

})();


'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('finishTravelIcon', finishTravelIcon);

    finishTravelIcon.$inject = ['MaterialIconsFactory'];

    function finishTravelIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('finishTravel');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('exitIcon', exitIcon);

    exitIcon.$inject = ['MaterialIconsFactory'];

    function exitIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('exit');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('editlocationIcon', editlocationIcon);

    editlocationIcon.$inject = ['MaterialIconsFactory'];

    function editlocationIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('edit_location');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('editItemIcon', editItemIcon);

    editItemIcon.$inject = ['MaterialIconsFactory'];

    function editItemIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('edit');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('driverIcon', driverIcon);

    driverIcon.$inject = ['MaterialIconsFactory'];

    function driverIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('driver');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('doneIcon', doneIcon);

    doneIcon.$inject = ['MaterialIconsFactory'];

    function doneIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('done');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('deleteItemIcon', deleteItemIcon);

    deleteItemIcon.$inject = ['MaterialIconsFactory'];

    function deleteItemIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('delete');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('configIcon', configIcon);

    configIcon.$inject = ['MaterialIconsFactory'];

    function configIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('config');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('clockIcon', clockIcon);

    clockIcon.$inject = ['MaterialIconsFactory'];

    function clockIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('clock');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('clearIcon', clearIcon);

    clearIcon.$inject = ['MaterialIconsFactory'];

    function clearIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('CLEAR');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('cityIcon', cityIcon);

    cityIcon.$inject = ['MaterialIconsFactory'];

    function cityIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('location_city');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('checkIcon', checkIcon);

    checkIcon.$inject = ['MaterialIconsFactory'];

    function checkIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('done');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('carIcon', carIcon);

    carIcon.$inject = ['MaterialIconsFactory'];

    function carIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('car');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('cancelIcon', cancelIcon);

    cancelIcon.$inject = ['MaterialIconsFactory'];

    function cancelIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('cancel');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('calendarIcon', calendarIcon);

    calendarIcon.$inject = ['MaterialIconsFactory'];

    function calendarIcon(MaterialIconsFactory) {
        return MaterialIconsFactory.generateByName('calendar');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .directive('backIcon', backIcon);

    backIcon.$inject = ['MaterialIconsFactory'];

    function backIcon(MaterialIconsFactory) {
      return MaterialIconsFactory.generateByName('back');
    }

})();

'use strict';

(function () {
    angular.module('material-design-icons')
        .constant('TEMPLATE_ICONS', new TemplateIcons());

    function TemplateIcons() {
      var TEMPLATES = {};

      TEMPLATES.CALENDAR = '&#xE24F;';
      TEMPLATES.CANCEL = '&#xE888;';
      TEMPLATES.CAR = '&#xE531;';
      TEMPLATES.CLOCK = '&#xE190;';
      TEMPLATES.DELETE = '&#xE872;';
      TEMPLATES.DONE = '&#xE876;';
      TEMPLATES.EDIT = '&#xE254;';
      TEMPLATES.PLUS = '&#xE148;';
      TEMPLATES.SAVE = '&#xE161;';
      TEMPLATES.HOME = '&#xE88A;';
      TEMPLATES.USER = '&#xE7FD;';
      TEMPLATES.CONFIG = '&#xE8B8;';
      TEMPLATES.SYNCHRONIZE = '&#xE8D6;';
      TEMPLATES.TRAVELING = '&#xE55D;';
      TEMPLATES.EXIT = '&#xE879;';
      TEMPLATES.TRAVELS ='&#xE8F8;';
      TEMPLATES.NEWTRAVEL = '&#xE613;';
      TEMPLATES.FINISHTRAVEL = '&#xE0C8;';
      TEMPLATES.NEXT = '&#xE01F;';
      TEMPLATES.BACK = '&#xE020;';
      TEMPLATES.PLAY = '&#xE037;';
      TEMPLATES.CLEAR = '&#xE14C;';
      TEMPLATES.DRIVER = '&#xE637;';
      TEMPLATES.LOCATION_CITY = 'location_city';
      TEMPLATES.DONE = 'done';
      TEMPLATES.PEOPLE = 'people';
      TEMPLATES.EDIT_LOCATION = 'my_location';

      return TEMPLATES;
    }


})();

'use strict';

(function () {
    angular.module('app.database', []);
})();

'use strict';

(function () {
    angular.module('app.database')
        .factory('$squel', $squel);

    $squel.$inject = ['$window'];

    function $squel($window) {
        return $window.squel;
    }

})();

'use strict';

(function () {
  angular.module('main')
        .service('DBClient', DBClient);

  DBClient.$inject = ['$injector', '$log', '$q', '$cordovaSQLite', '$rootScope', '$window', '$squel'];

    function DBClient( $injector, $log, $q, $cordovaSQLite, $rootScope, $window, $squel) {
        var self = this;
        var session = null;
        var DATABASE = $injector.get('Database');

        self.query = query;
        self.queryIfNotExistsTable = queryIfNotExistsTable;

        self.fetchAll = fetchAll;
        self.deleteDB = deleteDB;
        self.fetch = fetch;
        self.getSession = getSession;

        function getSession(){
          if(!session){
            if($window.cordova){
              $log.log('BANCO SQLITE');
              session = $cordovaSQLite.openDB(DATABASE.nameDatabase, 1);
            }else{
              $log.log('BANCO WEBSQL');
              session = $window.openDatabase(DATABASE.nameDatabase, '1.0', 'database', -1);
            }
          }

          $rootScope.$broadcast('DB:OK',true);

          return session;
        }

        function query(query, bindings) {
          bindings = typeof bindings !== 'undefined' ? bindings : [];
          var deferred = $q.defer();

          getSession().transaction(function(transaction) {
            transaction.executeSql(query, bindings, function(transaction, result) {
              deferred.resolve(result);
            }, function(transaction, error) {
              deferred.reject(error);
            });
          }, function(err){
            deferred.reject(err);
          });

          return deferred.promise;
        }

        function queryIfNotExistsTable(table, queryToExecute, bindings){
          return query($squel
            .select()
            .from('sqlite_master')
            .field('name')
            .where('type = ?', 'table')
            .where('name = ?', table)
            .toString())
            .then(function(data) {
              var result = fetchAll(data);

              if (result.length===0) {
                return query(queryToExecute, bindings);
              }

              return $q.when([]);
            });
        }

        function fetchAll(result) {
          var output = [];

          for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i));
          }

          return output;
        }

        function fetch(result) {
          if(result.rows.length > 0){
            return result.rows.item(0);
          }else {
            return null;
          }
        }

        function deleteDB(){
          $cordovaSQLite.deleteDB(DATABASE.nameDatabase);
        }

        return self;
    }

})();

'use strict';

(function () {
    angular.module('app.database')
        .provider('Tables', Tables);

    Tables.$inject = [];

    function Tables() {
        var self = this;
        var structure = {};

        self.setStructure = setStructure;

        function setStructure(value){
          structure = value;
        }

        self.$get = function(){
          return structure;
        };

        return self;
    }

})();

'use strict';

(function () {
    angular.module('app.database')
        .factory('TablesFactory', TablesFactory);

    TablesFactory.$inject = ['StringBuilder'];

    function TablesFactory(StringBuilder) {

      function TablesFactoryClass(){
          var self = this;

          self.newTable = newTable;

          function newTable(name, cols){
            var sql = StringBuilder.create()
                        .append('CREATE TABLE IF NOT EXISTS ')
                        .append(name)
                        .append(' ( ');

            angular.forEach(cols, function(col, nameCol){
              sql.append(nameCol)
                .append(' ')
                .append(col)
                .append(_.findLastKey(cols)!==nameCol ? ', ':' )')
            });

            return sql.toString();
          }

        }

        return new TablesFactoryClass();
    }
})();

'use strict';

(function () {
    angular.module('app.database')
        .provider('Database', Database);

    Database.$inject = [];

    function Database() {
        var self = this;
        var instance = {};

        self.setNameDatabase = setNameDatabase;

        function setNameDatabase(value){
          instance.nameDatabase = value;
        }

        self.$get = function(){
          return instance;
        };

        return self;
    }

})();

'use strict';

(function () {
    angular.module('app.database')
        .service('CreateDatabase', CreateDatabase);

    CreateDatabase.$inject = ['$injector', 'TablesFactory', '$log', '$q'];

    function CreateDatabase($injector, TablesFactory, $log, $q) {

        var TABLES = $injector.get('Tables');
        var DBClient = $injector.get('DBClient');

        var self = this;

        self.init = init;

        function init(){
          return buildTables();
        }

        function buildTables(){
          var promises = [];

          angular.forEach(TABLES.COLS, function(table, nameTable){
            promises.push(
              DBClient.queryIfNotExistsTable(
                nameTable,
                TablesFactory.newTable(nameTable, table)
              ).then($log.log, $log.error)
            );
          });

          return $q.all(promises);
        }

        return self;
    }
})();

'use strict';
(function () {

  angular.module('app.common', ['material-design-icons']);
})();

'use strict';

(function () {
    angular.module('app.common')
        .factory('StringBuilder', StringBuilder);

    StringBuilder.$inject = [];

    function StringBuilder() {
        var self = this;

        self.create = create;

        function create(){
          return new StringBuilderClass();
        }

        return self;
    }

    function StringBuilderClass(){
      var self = this;
      var strings = [];

      self.append = append;
      self.toString = toString;
      self.row = row;
      self.space = space;

      function append(value){
        var toBind = Array.prototype.slice.call(arguments, 1);

        if (value){
          if(toBind.length>0){
            angular.forEach(toBind, function(arg){
              var index = value.indexOf('?');

              if(typeof arg === 'string'){
                arg = '"'+arg+'"';
              }

              value = value.slice(0, index)+arg+value.slice(index+1);
            });
          }

          strings.push(value);
        }
        return self;
      }

      function row(){
        return append('\n');
      }

      function space(){
        return append(' ');
      }

      function toString(){
        return strings.join('');
      }
    }

})();

'use strict';

(function () {
    angular.module('app.common')
        .factory('popup', Popup);

  Popup.$inject = ['$ionicPopup', '$localStorage', '$injector', '$state', '$moment'];

    function Popup($ionicPopup, $localStorage, $injector, $state, $moment) {
      var LoginValidator = $injector.get('LoginValidator');

      var self = this;

        self.info = info;
        self.password = password;
        self.error = error;
        self.confirmation = confirmation;

        function info(message){
          var config = {};

          config.title = 'Informação';
          config.template = message;

          return $ionicPopup.alert(config);
        }

        function error(message){
          var config = {};

          config.title = 'Erro';
          config.template = message;
          config.okType = 'button-assertive';

          return $ionicPopup.alert(config);
        }

        function password(scope, usuarioToStorage, stateToGo){
          var instance = {};

          var eventUserOK = function(){
            instance.close();

            if(angular.isFunction(stateToGo)){
              stateToGo();
            }else if(angular.isString(stateToGo)){
              $state.go(stateToGo);
            }
          };

          instance = $ionicPopup.show(buildPopup(scope, usuarioToStorage, eventUserOK));

          return instance;
        }

        function confirmation(mensagem){
          return $ionicPopup.confirm({
            title: 'Atenção!',
            template: mensagem,
            buttons: [
              { text: 'Não' ,
                onTap: function() {
                  return false;
                }
              },
              {
                text: '<b>Sim</b>',
                type: 'button-positive',
                onTap: function() {
                  return true;
                }
              }
            ]
          });
        }

        function buildPopup(scope, usuarioToStorage, eventUserOK){
          var popup = {};

          scope.usuario = angular.copy(usuarioToStorage) || {};

          scope.usuario.senha = null;

          scope.passwordError = false;
          scope.passwordInvalid = false;

          popup.templateUrl = 'main/common/popups/password.template.html';
          popup.title = 'Informe sua Senha';

          popup.scope = scope;
          popup.buttons = [];

          popup.buttons.push({
            text: 'Cancelar',
            onTap: function(){
              return null;
            }
          });
          popup.buttons.push({
            text: '<b>OK</b>',
            type: 'button-positive',
            onTap: function(e){
              e.preventDefault();

              return LoginValidator.validate(scope.usuario).then(
                function(value){
                  if(!value.valid){
                    scope.passwordError = _.isNull(value.valid);
                    scope.passwordInvalid = value.valid === false;
                  }else{
                    $localStorage.setUsuario(usuarioToStorage);
                    $localStorage.setHorario($moment());

                    eventUserOK(true);
                  }

                  return value.valid;
                }
              );
            }
          });

          return popup;
        }

        return self;
    }

})();

'use strict';

(function() {
  angular.module('app.common')
    .controller('common.MenuCtrl', MenuCtrl);

  MenuCtrl.$inject = ['$log', '$state', 'LoginEventEmitter', '$rootScope', '$injector', '$localStorage'];

  function MenuCtrl($log, $state, LoginEventEmitter, $rootScope, $injector, $localStorage) {
    $log.log('common.MenuCtrl ativo!');

    var vm = this;
    var backgroundGeoLocation = !window.plugins ? undefined : window.plugins.backgroundGeoLocation;
    var MotoristaService = $injector.get('MotoristaService');

    vm.go = go;

    vm.estadosViagem = $localStorage.getEstadoViagem();

    if (!vm.estadosViagem) {
      vm.estadosViagem = {
        viajando: false,
        encerrando: false,
        novaViagem: true
      };

      $localStorage.setEstadoViagem(vm.estadosViagem);
    }

    vm.goSelectMotorista = goSelectMotorista;


    $rootScope.$on('ESTADO::VIAGEM', function(event, estado) {

      var estadoToStorage = {};

      estadoToStorage.viajando = !!estado.viajando;
      estadoToStorage.encerrando = !!estado.encerrando;
      estadoToStorage.novaViagem = !!estado.novaViagem;

      vm.estadosViagem = estadoToStorage;

      $localStorage.setEstadoViagem(estadoToStorage);
    });

    function go(to, eventBeforeStateGo) {
      var eventAfterValidatePassword = function() {
        $state.goNoHistory(to)
      };

      LoginEventEmitter.onStateGo(eventAfterValidatePassword).then(function(valid) {
        if (valid) {
          if (angular.isFunction(eventBeforeStateGo)) {
            eventBeforeStateGo();
          }

          eventAfterValidatePassword();
        }
      });
    }

    function goSelectMotorista() {
      MotoristaService.setNextState('app.veiculo');
      MotoristaService.setOnlySelectionDriver(false);

      $state.go('app.usuario');
    }

    $rootScope.$on('CAPTAR::PONTOS', function() {
      startGetLocation();
    });

    $rootScope.$on('PARAR::CAPTAR::PONTOS', function() {
      backgroundGeoLocation.stop();
    });

    if ($localStorage.getPontosGps() && $localStorage.getPontosGps().isRunning) {
      startGetLocation();
    }

    function startGetLocation() {

    var callbackFn = function(location) {
        console.log('[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude);
        var latitude = location.latitude;
        var longitude = location.longitude;
        var pontos = [];
        if($localStorage.getPontosGps() && $localStorage.getPontosGps().pontos){
          pontos = $localStorage.getPontosGps().pontos;
        }


        $log.log('lat: ' + latitude);
        $log.log('long: ' + longitude);

        if (!_.find(pontos, {
            latitude: latitude,
            longitude: longitude
          })) {

          pontos.push({
            latitude: latitude,
            longitude: longitude,
            velocidade: null
          });

          $localStorage.setPontosGps({
            isRunning: true,
            pontos: pontos
          });
        }
        backgroundGeoLocation.finish();
      };

      var failureFn = function(error) {
        console.log('BackgroundGeoLocation error: ' + error);
      };

      backgroundGeoLocation.configure(callbackFn, failureFn, {
        desiredAccuracy: 10,
        stationaryRadius: 20,
        distanceFilter: 30,
        debug: false,
        stopOnTerminate: false,
        locationTimeout: 10,
        notificationTitle: 'Diário de Bordo', // <-- android only, customize the title of the notification
        notificationText: 'Coletando pontos em segundo plano'
      });

      backgroundGeoLocation.start();

    }

  }
})();

'use strict';

(function () {
    angular.module('app.common')
        .provider('$localStorage', $localStorage);

    function $localStorage() {
        var self = this;
        var VARIABLE_IN_STORAGE = {};
        var instance;

        self.setStorage = setStorage;

        function setStorage(value){
          VARIABLE_IN_STORAGE = value;
        }

        self.$get = function($moment){
          return createInstance($moment);
        };

        function createInstance($moment){
          instance = {};

          angular.forEach(VARIABLE_IN_STORAGE, function(object, field){
            var fieldFormatted = suffixFactory(field);

            switch(object.type){
              case 'object':
                objectFactory(field, fieldFormatted);
                break;
              case 'moment':
                momentFactory(field, fieldFormatted, $moment);
                break;
              case 'string':
                stringFactory(field, fieldFormatted);
                break;
              case 'boolean':
                booleanFactory(field, fieldFormatted);
                break;
              case 'number':
                numberFactory(field, fieldFormatted);
                break;
            }
          });

          return instance;
        }

        function suffixFactory(field){
          var words = field.toLowerCase().split('_');

          return _.chain(words)
                  .map(_.capitalize)
                  .reduce(function(result, word){
                    return result.concat(word);
                  })
                  .value();
        }

        function objectFactory(field, fieldFormatted){
          instance['get'.concat(fieldFormatted)] = function(){
            var result = getItem(VARIABLE_IN_STORAGE[field].name);

            return result !=='undefined' ? JSON.parse(result) : null;
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              JSON.stringify(value));
          };
        }

        function momentFactory(field, fieldFormatted, $moment){
          instance['get'.concat(fieldFormatted)] = function(){
            var result = getItem(VARIABLE_IN_STORAGE[field].name);
            return !result ? $moment(): $moment(result);
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              value.toString());
          };
        }

        function numberFactory(field, fieldFormatted){
          instance['get'.concat(fieldFormatted)] = function(){
            return Number(getItem(VARIABLE_IN_STORAGE[field].name));
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              value);
          };
        }

        function stringFactory(field, fieldFormatted){
          instance['get'.concat(fieldFormatted)] = function(){
            return getItem(VARIABLE_IN_STORAGE[field].name);
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              value);
          };
        }

        function booleanFactory(field, fieldFormatted){
          instance['get'.concat(fieldFormatted)] = function(){
            return getItem(VARIABLE_IN_STORAGE[field].name==='true');
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              value+'');
          };
        }

        function getItem(key){
          return window.localStorage.getItem(key);
        }

        function setItem(key, value){
          window.localStorage.setItem(key, value);
        }

        return self;
    }

})();

'use strict';

(function () {
    angular.module('app.common')
        .factory('$ionicUtils', $ionicUtils);

    $ionicUtils.$inject = ['$ionicScrollDelegate'];

    function $ionicUtils($ionicScrollDelegate) {
        var self = this;

        self.toTop = toTop;

        function toTop(handleName){
          if(handleName){
            $ionicScrollDelegate.$getByHandle(handleName).resize().then(function() {
              $ionicScrollDelegate.$getByHandle(handleName).getScrollView().scrollTo(0, 0, false);
            });
          }else{
            $ionicScrollDelegate.resize().then(function() {
              $ionicScrollDelegate.getScrollView().scrollTo(0, 0, false);
            });
          }
        }

        return self;
    }

})();

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

'use strict';

(function(){

  angular.module('app.common')
    .factory('EventEmitter', EventEmitterService);

  function EventEmitterService(){
    return EventEmitter;
  }

  function EventEmitter(){

    var self = this;
    var events = [];

    self.event = event;
    self.on = on;
    self.getEvents = getEvents;

    function on(name, anotherEvent){
      return anotherEvent ? self[name](anotherEvent) : self[name]();
    }

    function event(name, handle){
      events.push(name);
      self[name] = handle;
    }

    function getEvents(){
      return events;
    }

    //shorthands
    self.eventSave = eventSave;
    self.eventStateGo = eventStateGo;
    self.onSave = onSave;
    self.onStateGo = onStateGo;

    function eventSave(handle){
      event('onSave', handle);
    }

    function eventStateGo(handle){
      event('onStateGo', handle);
    }

    function onSave(anotherEvent){
      return on('onSave', anotherEvent);
    }

    function onStateGo(anotherEvent){
      return on('onStateGo',anotherEvent);
    }
  }

})();

'use strict';

(function () {
    angular.module('app.common')
        .filter('momentToTime', momentToTime);

    momentToTime.$inject = ['$moment'];

    function momentToTime($moment) {
        function self(momentValue) {
          if(!momentValue){
            return '';
          }

          return $moment(momentValue)
            .format('HH:mm');
        }

        return self;
    }
})();

'use strict';

(function () {
    angular.module('app.common')
        .filter('momentToDate', momentToDate)
        .filter('momentToHour', momentToHour);

    momentToDate.$inject = ['$moment']

    function momentToDate($moment) {
      function self(value){
        if(!value){
          return '';
        }

        return $moment(value)
          .format('DD/MM/YYYY');
      }

      return self;

    }
    momentToHour.$inject = ['$moment']
    function momentToHour($moment) {
      function self(value){
        if(!value){
          return '';
        }

        return $moment(value)
          .format('HH:mm:SS');
      }

      return self;

    }
})();

'use strict';

(function () {
    angular.module('app.common')
        .factory('$moment', momentWrapper);

    momentWrapper.$inject = ['$window'];

    function momentWrapper($window) {
      var self = $window.moment;

      self.fn.toString = toString;

      function toString () {
        return this.format('YYYY-MM-DD HH:mm:ss');
      }

      return self;
    }

})();

'use strict';

(function () {
    angular.module('app.common')
        .service('$dateTimePicker', $dateTimePicker);

    $dateTimePicker.$inject = ['$cordovaDatePicker', '$moment'];

    function $dateTimePicker($cordovaDatePicker, $moment) {
        var self = this;

        var options = {
          allowOldDates: true,
          allowFutureDates: false,
          doneButtonLabel: 'OK',
          doneButtonColor: '#4a87ee',
          cancelButtonLabel: 'Cancelar',
          cancelButtonColor: '#f8f8f8'
        };

        self.openDate = openDate;
        self.openTime = openTime;

        function openDate(receiver, onTap, customOptions){
          var dateToPicker = new Date();

          if(receiver){
            dateToPicker.setDate(receiver.date());
            dateToPicker.setMonth(receiver.month());
            dateToPicker.setFullYear(receiver.year());
          }

          var dateOption = {
            date: dateToPicker,
            mode: 'date'
          };

          function callback(value){
            if(!receiver){
              receiver = $moment();
            }

            receiver.date(value.getDate());
            receiver.month(value.getMonth());
            receiver.year(value.getFullYear());

            if(angular.isFunction(onTap)){
              onTap();
            }

            return receiver;
          }

          return $cordovaDatePicker
            .show(angular.extend(dateOption, options, customOptions))
            .then(callback);
        }

        function openTime(receiver, onTap, customOptions){
          var timeToPicker = new Date();

          if(receiver){
            timeToPicker.setHours(receiver.hours());
            timeToPicker.setMinutes(receiver.minutes());
          }

          var timeOption = {
            date: timeToPicker,
            mode: 'time'
          };

          function callback(value){
            if(!receiver){
              receiver = $moment();
            }

            receiver.hour(value.getHours());
            receiver.minute(value.getMinutes());

            if(angular.isFunction(onTap)){
              onTap();
            }

            return receiver;
          }

          return $cordovaDatePicker
            .show(angular.extend(timeOption, options, customOptions))
            .then(callback);
        }

        return self;
    }

})();

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

'use strict';

(function () {
    angular.module('app.common')
        .directive('ckButtonDate', ckButtonDate)
        .controller('ButtonDateCtrl', ButtonDateCtrl);

    ckButtonDate.$inject = [];

    function ckButtonDate() {
      var dc = {};

      dc.template = '<button class="button button-fab button-small button-calm" ' +
        'ng-click="vm.openDatePicker(); $event.stopPropagation();">' +
        '<ng-transclude></ng-transclude>' +
        '</button>';

      dc.require = 'ngModel';

      dc.scope = {};
      dc.scope.ngModel = '=';
      dc.scope.onTap = '=';
      dc.scope.listener = '=';
      dc.transclude = true;

      dc.controller = 'ButtonDateCtrl';
      dc.controllerAs = 'vm';

      return dc;
    }

    ButtonDateCtrl.$inject = ['$scope','$dateTimePicker'];

    function ButtonDateCtrl($scope, $dateTimePicker){
      var vm = this;

      vm.openDatePicker = openDatePicker;

      function openDatePicker(){
        $dateTimePicker.openDate($scope.ngModel, $scope.onTap).then(function(data){
          $scope.ngModel = data;
          $scope.$applyAsync();
          $scope.listener(data);
        });
      }


    }

})();

'use strict';

(function () {
    angular.module('app.common')
        .factory('$jsSHA', $jsSHA);

    $jsSHA.$inject = [];

    function $jsSHA() {
        var self = this;

        self.criptografar = criptografar;

        function criptografar(value){
          var myJsSHA = new jsSHA(value, 'TEXT');

          return myJsSHA.getHash('SHA-256', 'HEX').toUpperCase();
        }

        return self;
    }

})();

'use strict';

(function () {
  angular.module('app.common')
    .factory('ParametrosApp', ParametrosApp);

  ParametrosApp.$inject = ['$localStorage'];

  function ParametrosApp($localStorage) {
    var self = this;

    var timeSession = new TimeSession($localStorage);
    self.getTimeSession = getTimeSession;

    function getTimeSession(){
      return timeSession;
    }

    return self;
  }

  function TimeSession($localStorage){
    var self = this;

    var MINUTES_SESSION_DEFAULT = 15;
    var TIME_SESSION_DEFAULT = MINUTES_SESSION_DEFAULT * 60 * 1000;

    self.setMiliseconds = setMiliseconds;
    self.getMiliseconds = getMiliseconds;
    self.setMinutes = setMinutes;
    self.getMinutes = getMinutes;

    function toStorage(sessionMS){
      $localStorage.setSessao(sessionMS);
    }

    function fromStorage(){
      return $localStorage.getSessao();
    }

    function setMiliseconds(ms){
      toStorage(ms);
    }

    function getMiliseconds(){
      return fromStorage() || TIME_SESSION_DEFAULT;
    }

    function setMinutes(minute){
      toStorage(minute * 60 * 1000);
    }

    function getMinutes(){
      var timeSession = fromStorage();

      return !timeSession ? MINUTES_SESSION_DEFAULT : Math.round(timeSession/60/1000);
    }
  }

})();

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

'use strict';
( function () {

  angular.module('app.common')
    .config(function ($stateProvider, $urlRouterProvider) {

      var stateFactory = {};

      stateFactory.of = of;
      stateFactory.ofCacheFalse = ofCacheFalse;

      function of(url, templateUrl, controller, options){
        var state = _.chain({})
         .set('url', url)
         .set('views.pageContent.templateUrl',templateUrl)
         .set('views.pageContent.controller',controller)
         .value();

        return angular.extend(state, options);
      }

      function ofCacheFalse(url, templateUrl, controller){
        return of(url, templateUrl, controller, {cache: false});
      }

      $urlRouterProvider.otherwise('/main/inicio');
      $stateProvider
        .state('app',{
          url: '/main',
          abstract: true,
          templateUrl: 'main/common/menu/menu.html',
          controller: 'common.MenuCtrl as vm'
        })
        .state('app.inicio', stateFactory.ofCacheFalse('/inicio', 'main/view-inicial/inicio.html', 'main.InicioCtrl as vm'))
        .state('app.usuario', stateFactory.ofCacheFalse('/usuario', 'main/usuario/motorista/select-motorista.html', 'usuario.SelectMotoristaCtrl as vm'))
        .state('app.passageiro', stateFactory.ofCacheFalse('/usuario/passageiro', 'main/usuario/passageiros/passageiros.html', 'usuario.PassageiroCtrl as vm'))
        .state('app.cidade', stateFactory.ofCacheFalse('/cidade', 'main/usuario/cidade/cidade.html', 'cidade.SelectCidadeCtrl as vm'))
        .state('app.veiculo', stateFactory.ofCacheFalse('/usuario/veiculo', 'main/usuario/veiculo/select-veiculo.html', 'usuario.SelectVeiculoCtrl as vm'))
        .state('app.roteiro', stateFactory.ofCacheFalse('/usuario/roteiro', 'main/usuario/roteiro/select-roteiro.html', 'usuario.SelectRoteiroCtrl as vm'))
        .state('app.viagens', stateFactory.ofCacheFalse('/viagens', 'main/viagem/viagens-encerradas.html', 'viagem.ViagensEncerradasCtrl as vm'))
        .state('app.novaviagem', stateFactory.ofCacheFalse('/nova-viagem', 'main/viagem/emviagem/nova-viagem.html', 'viagem.NovaViagemCtrl as vm'))
        .state('app.viajando', stateFactory.ofCacheFalse('/viajando', 'main/viagem/emviagem/viajando.html', 'viagem.ViajandoCtrl as vm'))
        .state('app.encerrando-viagem', stateFactory.ofCacheFalse('/encerrando-viagem', 'main/viagem/emviagem/encerrar-viagem.html', 'viagem.EncerrarViagemCtrl as vm'))
        .state('app.configuracao', stateFactory.of('/configuracao', 'main/common/configuracao/configuracao.html', 'common.ConfiguracaoCtrl as vm'))
        .state('app.sincronizar', stateFactory.ofCacheFalse('/sincronizar', 'main/sincronizar/sincronizar.html', 'SincronizarCtrl as vm'))
        .state('app.sincronizando', stateFactory.ofCacheFalse('/sincronizando', 'main/sincronizar/sincronizando.html', 'SincronizandoCtrl as vm'))
        .state('app.cad-viagem', stateFactory.of('/cad-viagem', 'main/viagem/cadastro-viagem.html', 'viagem.CadastroViagemCtrl as vm'))
    });
})();

'use strict';

(function () {
    angular.module('app.common')
        .config(ionicConfigFunction);

    function ionicConfigFunction($ionicConfigProvider) {
      $ionicConfigProvider.scrolling.jsScrolling(false);
    }
})();

'use strict';
angular.module('diarioDeBordo', [
  'main'
]);

'use strict';

(function() {
  angular.module('diarioDeBordo')
    .run(appRun);

  appRun.$inject = ['$ionicPlatform', 'DBClient', '$cordovaGeolocation', '$log'];

  function appRun($ionicPlatform, DBClient, $cordovaGeolocation, $log) {
    $ionicPlatform.ready(function() {

      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }

      DBClient.getSession();

      var options = {
        timeout: 120000,
        enableHighAccuracy: true
      };

      $cordovaGeolocation
        .getCurrentPosition(options)
        .then(function(position) {
          var lat = position.coords.latitude;
          var long = position.coords.longitude;

          $log.log(position);
          $log.log('lat: ' + lat);
          $log.log('long: ' + long);
        }, $log.error);
    });


  }
})();

'use strict';

(function () {
    angular.module('diarioDeBordo')
        .config(appConfig);

    function appConfig($ionicConfigProvider) {
      $ionicConfigProvider.views.forwardCache(false);
      $ionicConfigProvider.views.maxCache(0);
      $ionicConfigProvider.scrolling.jsScrolling(false);
    }
})();
