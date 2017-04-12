'use strict';

describe('Em relacao a selecao de veiculos', function () {
  var veiculosMock = readJSON('test/mock/veiculos/veiculos.json'),
    SelectVeiculoCtrl,
    $localStorage;

  beforeEach(module('main'));

  beforeEach(inject(function($injector, $rootScope, $controller, $q){
    var dependencys = {};
    var scope = $rootScope.$new(true);
    var VeiculoService = $injector.get('VeiculoService');

    $localStorage = $injector.get('$localStorage');

    spyOn(VeiculoService, 'listAll').and.returnValue($q.when(veiculosMock));

    dependencys.$scope = scope;
    dependencys.VeiculoService = VeiculoService;

    SelectVeiculoCtrl = $controller('usuario.SelectVeiculoCtrl', dependencys);

    SelectVeiculoCtrl.loadMoreData();

    scope.$digest();

  }));

  it(' - propriedades iniciais', function(){

    expect(SelectVeiculoCtrl.tracker).toBeDefined();
    expect(SelectVeiculoCtrl.tracker.loading).toBeDefined();

    expect(SelectVeiculoCtrl.comeBack).toBeDefined();
    expect(SelectVeiculoCtrl.nextStep).toBeDefined();
    expect(SelectVeiculoCtrl.selectItem).toBeDefined();

    expect(SelectVeiculoCtrl.veiculos.length).toBeGreaterThan(0);

  });

  it(' - selectItem', function(){

    var item = _.first(SelectVeiculoCtrl.veiculos);

    var event = {};

    item.selected = false;

    _.set(event, 'originalEvent.constructor.name', 'mouseEvent');

    SelectVeiculoCtrl.selectItem(item, event);

    expect(SelectVeiculoCtrl.itemSelected.codigo).toBe(item.codigo);

    SelectVeiculoCtrl.comeBack();

    expect(SelectVeiculoCtrl.itemSelected).toBeNull();

  });

  it(' - nextStep', function(){

    var item = _.first(SelectVeiculoCtrl.veiculos);

    var event = {};

    item.selected = false;

    _.set(event, 'originalEvent.constructor.name', 'mouseEvent');

    SelectVeiculoCtrl.selectItem(item, event);

    expect(SelectVeiculoCtrl.itemSelected.codigo).toBe(item.codigo);

    SelectVeiculoCtrl.nextStep();

    var veiculoStorage = $localStorage.getVeiculo();

    expect(veiculoStorage.codigo).toBe(item.codigo);
  });
});
