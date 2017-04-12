'use strict';

describe('Em relacao ao controller ViajandoCtrl ', function () {
  var scope, rootScope, $localStorage, VeiculoService,
      viagensMock = readJSON('test/mock/viagens/viagens.json'),
      motoristasMock = readJSON('test/mock/motoristas/motoristas.json'),
      veiculosMock = readJSON('test/mock/veiculos/veiculos.json'),
      ViajandoCtrl, moment;

  beforeEach(module('main'));

  beforeEach(inject(function($injector, $controller, $rootScope){

    var dependency = {}, viagem;

    rootScope = $rootScope;
    scope = rootScope.$new(true);
    $localStorage = $injector.get('$localStorage');
    VeiculoService = $injector.get('VeiculoService');
    moment = $injector.get('$moment');

    viagem = _.first(viagensMock);

    viagem.saida = moment();

    $localStorage.setViagem(viagem);
    $localStorage.setHorario(moment());
    $localStorage.setUsuario(_.first(motoristasMock));
    $localStorage.setVeiculo(_.first(veiculosMock));

    dependency.$scope = scope;
    dependency.VeiculoService = VeiculoService;

    ViajandoCtrl = $controller('viagem.ViajandoCtrl', dependency);

    scope.$digest();

  }));

  it(' - propriedades iniciais', function(){

    expect(ViajandoCtrl.viagem).toBeDefined();
    expect(ViajandoCtrl.encerrar).toBeDefined();
    expect(ViajandoCtrl.goSelectMotorista).toBeDefined();
    expect(ViajandoCtrl.goSelectVeiculo).toBeDefined();
    expect(ViajandoCtrl.refreshSaida).toBeDefined();

  });

  it(' - method refreshSaida', function(){

    var now = moment();

    ViajandoCtrl.viagem.saida = now;

    ViajandoCtrl.refreshSaida();

    expect(moment(ViajandoCtrl.initTempoViagem).toString()).toBe(now.toString());

  });

  it(' - encerrar', function(){
    ViajandoCtrl.encerrar();

    rootScope.$on('ESTADO::VIAGEM', function(event,estado){
      expect(estado.encerrando).toBeTruthy();
    });

    scope.$digest();
  });

});
