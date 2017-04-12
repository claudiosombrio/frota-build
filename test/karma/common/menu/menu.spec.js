'use strict';

describe('Em relacao ao menu controller', function () {

  var LoginEventEmitter, scope, MenuCtrl, $rootScope, $state, $localStorage;

  beforeEach(module('main'));

  beforeEach(inject(function($injector, $controller){
    var dependencys = {};

    $state = $injector.get('$state');
    $localStorage = $injector.get('$localStorage');

    $rootScope = $injector.get('$rootScope');

    scope = $rootScope.$new(true);

    spyOn($state, 'goNoHistory');

    LoginEventEmitter = $injector.get('LoginEventEmitter');

    dependencys.$scope = scope;
    dependencys.LoginEventEmitter = LoginEventEmitter;
    dependencys.$state = $state;

    MenuCtrl = $controller('common.MenuCtrl', dependencys);

    scope.$digest();
  }));

  it(' - init controller', function(){
    expect(MenuCtrl.go).toBeDefined();
  });

  it(' - go method', function(){

    $localStorage.setHorario(moment());

    MenuCtrl.go('app.inicio');

    $rootScope.$digest();

    expect($state.goNoHistory.calls.any()).toBeTruthy();

  });
});
