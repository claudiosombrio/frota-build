'use strict';

describe('Em relacao ao servico login-event-emitter ', function () {
  var LoginEventEmitter,
      motoristaMock,
      veiculoMock,
      $localStorage,
      $rootScope;

  motoristaMock =  readJSON('test/mock/motoristas/motoristas.json')[0];
  veiculoMock = readJSON('test/mock/veiculos/veiculos.json')[0];

  beforeEach(module('main'));

  beforeEach(inject(function($injector){
    $localStorage = $injector.get('$localStorage');
    $rootScope = $injector.get('$rootScope');

    $localStorage.setUsuario(motoristaMock);
    $localStorage.setVeiculo(veiculoMock);

    LoginEventEmitter = $injector.get('LoginEventEmitter');

  }));

  it(' - das propriedades iniciais ', function(){
    expect(LoginEventEmitter.onSave).toBeDefined();
    expect(LoginEventEmitter.onStateGo).toBeDefined();
    expect(LoginEventEmitter.onBeginApp).toBeDefined();
  });

  it(' - validateSession ', function(){

    $localStorage.setHorario(moment());

    LoginEventEmitter.onSave().then(function(valid){
      expect(valid).toBeTruthy();
    });

    $rootScope.$digest();

  });


});
