'use strict';

describe('Em relacao a inicializacao do app', function () {
  var ctrl,
      $rootScope,
      motoristaMock,
      veiculoMock;

  motoristaMock =  readJSON('test/mock/motoristas/motoristas.json')[0];
  veiculoMock = readJSON('test/mock/veiculos/veiculos.json')[0];

  beforeEach(module('main'));

  beforeEach(inject(function($injector, $controller){
    var dependencyCtrl = {};
    $rootScope = $injector.get('$rootScope');
    var scope = $rootScope.$new(true);

    var LoginEventEmitter = $injector.get('LoginEventEmitter');
    var $localStorage = $injector.get('$localStorage');

    $localStorage.setUsuario(motoristaMock);
    $localStorage.setVeiculo(veiculoMock);
    $localStorage.setHorario(moment());

    dependencyCtrl.$scope = scope;
    dependencyCtrl.$localStorage = $localStorage;
    dependencyCtrl.LoginEventEmitter = LoginEventEmitter;

    ctrl = $controller('main.InicioCtrl',dependencyCtrl);

  }));

  it('main.InicioCtrl init', function(){
    expect(ctrl.user).toBeDefined();
    expect(ctrl.veiculo).toBeDefined();
  });

});
