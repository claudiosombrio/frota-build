'use strict';

describe('Em relacao ao controller EncerrarViagemCtrl', function () {
  var $localStorage, scope, ViagemService, EncerrarViagemCtrl, rootScope,
    viagensMock = readJSON('test/mock/viagens/viagens.json'),
    motoristasMock = readJSON('test/mock/motoristas/motoristas.json'),
    veiculosMock = readJSON('test/mock/veiculos/veiculos.json'),
    idInsert = 99;


  beforeEach(module('main'));

  beforeEach(inject(function($injector, $rootScope, $q, $controller){
    var dependency = {}, viagem;

    $localStorage = $injector.get('$localStorage');
    ViagemService = $injector.get('ViagemService');
    rootScope = $rootScope;

    viagem = _.first(viagensMock);

    viagem.saida = moment();

    $localStorage.setViagem(viagem);
    $localStorage.setHorario(moment());
    $localStorage.setUsuario(_.first(motoristasMock));
    $localStorage.setVeiculo(_.first(veiculosMock));
    $localStorage.setPontosGps({isRunning:false, pontos: []});

    spyOn(ViagemService, 'insert').and.returnValue($q.when({insertId: idInsert}));

    scope = $rootScope.$new(true);

    dependency.$scope = scope;
    dependency.ViagemService = ViagemService;

    EncerrarViagemCtrl = $controller('viagem.EncerrarViagemCtrl', dependency);

    scope.$digest();

  }));

  it(' - propriedades iniciais', function(){

    expect(EncerrarViagemCtrl.viagem).toBeDefined();
    expect(EncerrarViagemCtrl.finalizarEncerramento).toBeDefined();
    expect(EncerrarViagemCtrl.goSelectMotorista).toBeDefined();
    expect(EncerrarViagemCtrl.goSelectVeiculo).toBeDefined();
    expect(EncerrarViagemCtrl.viagem.chegada).toBeDefined();

  });

  it(' - method finalizarEncerramento', function(){
    EncerrarViagemCtrl.form = {};
    EncerrarViagemCtrl.form.$valid = true;
    EncerrarViagemCtrl.form.$setSubmitted = function(){};

    EncerrarViagemCtrl.finalizarEncerramento();

    scope.$digest();

    expect(EncerrarViagemCtrl.viagem.codigo).toBe(idInsert);
  });

});
