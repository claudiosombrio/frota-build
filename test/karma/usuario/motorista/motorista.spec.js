'use strict';

describe('Em relacao a selecao do motorista ', function () {

  var motoristasMock = readJSON('test/mock/motoristas/motoristas.json'),
      scope,
      SelectMotoristaCtrl;

  beforeEach(module('main'));

  beforeEach(inject(function($injector, $rootScope, $controller, $q){
    var dependencys = {};
    var MotoristaService = $injector.get('MotoristaService');

    scope = $rootScope.$new(true);

    spyOn(MotoristaService, 'listAll').and.returnValue($q.when(motoristasMock));

    dependencys.$scope = scope;
    dependencys.MotoristaService = MotoristaService;

    SelectMotoristaCtrl = $controller('usuario.SelectMotoristaCtrl', dependencys);

    SelectMotoristaCtrl.loadMoreData();
    scope.$digest();

  }));

  it(' - propriedades iniciais', function(){

    expect(SelectMotoristaCtrl.tracker).toBeDefined();
    expect(SelectMotoristaCtrl.tracker.loading).toBeDefined();

    expect(SelectMotoristaCtrl.cancelSelection).toBeDefined();
    expect(SelectMotoristaCtrl.nextStep).toBeDefined();
    expect(SelectMotoristaCtrl.selectItem).toBeDefined();

    expect(SelectMotoristaCtrl.motoristas.length).toBeGreaterThan(0);

  });

  it(' - selectItem and cancelSelection', function(){

    var item = _.first(SelectMotoristaCtrl.motoristas);

    var event = {};

    _.set(event, 'originalEvent.constructor.name', 'mouseEvent');

    SelectMotoristaCtrl.selectItem(item, event);

    expect(SelectMotoristaCtrl.itemSelected.codigo).toBe(item.codigo);

    SelectMotoristaCtrl.cancelSelection();

    expect(SelectMotoristaCtrl.itemSelected).toBeNull();

  });



});
