'use strict';

describe('Em relacao ao controller CadastroViagemCtrl', function () {
  var scope,
      viagensMock = readJSON('test/mock/viagens/viagens.json'),
      motoristasMock = readJSON('test/mock/motoristas/motoristas.json'),
      veiculosMock = readJSON('test/mock/veiculos/veiculos.json'),
      CadastroViagemCtrl,
      LoginEventEmitter,
      ViagemService;

  beforeEach(module('main'));

  beforeEach(inject(function($injector, $rootScope, $controller, $q){

    var dependencies = {};
    var $localStorage = $injector.get('$localStorage');
    ViagemService = $injector.get('ViagemService');
    LoginEventEmitter = $injector.get('LoginEventEmitter');
    var $moment = $injector.get('$moment');

    scope = $rootScope.$new(true);

    $localStorage.setUsuario(_.first(motoristasMock));
    $localStorage.setVeiculo(_.first(veiculosMock));
    $localStorage.setHorario($moment());


    spyOn(ViagemService, 'save').and.returnValue($q.when(_.first(viagensMock)));

    dependencies.$scope = scope;
    dependencies.ViagemService = ViagemService;
    dependencies.LoginEventEmitter = LoginEventEmitter;

    CadastroViagemCtrl = $controller('viagem.CadastroViagemCtrl', dependencies);

    scope.$digest();
  }));

  it(' - propriedades iniciais', function(){
    expect(CadastroViagemCtrl.tracker).toBeDefined();

    expect(CadastroViagemCtrl.save).toBeDefined();
    expect(CadastroViagemCtrl.openDatePicker).toBeDefined();
    expect(CadastroViagemCtrl.openTimePicker).toBeDefined();
  });

  it(' - save', function(){

    CadastroViagemCtrl.form = {};
    CadastroViagemCtrl.form.$valid = true;
    CadastroViagemCtrl.form.$setSubmitted = function(){};

    var viagem = _.first(viagensMock);

    CadastroViagemCtrl.save(viagem);

    scope.$digest();

    expect(CadastroViagemCtrl.viagem.codigo).toEqual(viagem.codigo);

  });

});
