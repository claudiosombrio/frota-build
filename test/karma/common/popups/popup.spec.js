'use strict';

describe('Em relação a popup factory ', function () {
  var popup,
    scope,
    motoristaMock =  readJSON('test/mock/motoristas/motoristas.json')[0];

  beforeEach(module('main'));

  beforeEach(inject(function($injector){
    popup = $injector.get('popup');
    scope = $injector.get('$rootScope').$new(true);
  }));

  it(' - password', function(){
    var instance = popup.password(scope, motoristaMock);

    expect(instance).toBeDefined();
  });

  it(' - info', function(){
    var instance = popup.info('Teste');

    expect(instance).toBeDefined();
  });

});
