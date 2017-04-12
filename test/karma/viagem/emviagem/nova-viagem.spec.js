'use strict';

describe('Em relacao ao controller NovaViagemCtrl', function () {
  var $localStorage,
      DBClient,
      LoginEventEmitter,
      ViagemService,
      viagensMock = readJSON('test/mock/viagens/viagens.json'),
      motoristasMock = readJSON('test/mock/motoristas/motoristas.json'),
      veiculosMock = readJSON('test/mock/veiculos/veiculos.json'),
      NovaViagemCtrl,
      scope,
      $moment,
      $state,
      _$rootScope;

  beforeEach(module('main'));

  beforeEach(inject(function($injector, $controller, $rootScope, $q){
    var dependency = {};

    scope = $rootScope.$new(true);
    _$rootScope = $rootScope;

    $localStorage = $injector.get('$localStorage');
    DBClient = $injector.get('DBClient');
    ViagemService = $injector.get('ViagemService');
    LoginEventEmitter = $injector.get('LoginEventEmitter');
    $moment = $injector.get('$moment');
    $state = $injector.get('$state');

    spyOn(ViagemService, 'list').and.returnValue($q.when(viagensMock));

    $localStorage.setUsuario(motoristasMock);
    $localStorage.setVeiculo(veiculosMock);
    $localStorage.setHorario($moment);

    dependency.$localStorage = $localStorage;
    dependency.DBClient = DBClient;
    dependency.ViagemService = ViagemService;
    dependency.LoginEventEmitter = LoginEventEmitter;
    dependency.$scope = scope;
    dependency.$state = $state;

    NovaViagemCtrl = $controller('viagem.NovaViagemCtrl', dependency);

    scope.$digest();

  }));

  it(' - propriedades iniciais', function(){
    expect(NovaViagemCtrl.viagem).toBeDefined();
    expect(NovaViagemCtrl.viagem.motorista).toBeDefined();
    expect(NovaViagemCtrl.viagem.veiculo).toBeDefined();

    expect(NovaViagemCtrl.iniciaViagem).toBeDefined();
    expect(NovaViagemCtrl.goSelectMotorista).toBeDefined();
    expect(NovaViagemCtrl.goSelectVeiculo).toBeDefined();

  });

  it(' - metodo iniciaViagem', function(){
    $localStorage.setUsuario(motoristasMock);
    $localStorage.setVeiculo(veiculosMock);
    $localStorage.setHorario($moment());

    NovaViagemCtrl.form = {};
    NovaViagemCtrl.form.$valid = true;
    NovaViagemCtrl.form.$setSubmitted = function(){};

    NovaViagemCtrl.iniciaViagem();

    _$rootScope.$on('ESTADO::VIAGEM', function(event,estado){
      expect(estado.viajando).toBeTruthy();
    });

    scope.$digest();
  });
});
