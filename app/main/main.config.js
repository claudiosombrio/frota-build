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
