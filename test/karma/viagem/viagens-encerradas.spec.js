'use strict';

describe('Em relacao ao controller ViagensEncerradasCtrl', function () {

  var ViagemService, scope, $ionicUtils,
    viagensMock = readJSON('test/mock/viagens/viagens.json'),
    motoristasMock = readJSON('test/mock/motoristas/motoristas.json'),
    veiculosMock = readJSON('test/mock/veiculos/veiculos.json'),
    ViagensEncerradasCtrl;

  beforeEach(module('main'));

  beforeEach(inject(function($injector, $controller, $rootScope, $q){
    var dependency = {}, listBuilder;

    ViagemService = $injector.get('ViagemService');
    $ionicUtils = $injector.get('$ionicUtils');

    scope = $rootScope.$new(true);
    var $localStorage = $injector.get('$localStorage');

    $localStorage.setUsuario(_.first(motoristasMock));
    $localStorage.setVeiculo(_.first(veiculosMock));

    listBuilder = ViagemService.createQueryListBuilder();

    listBuilder.build = function(){ return $q.when(viagensMock); };

    spyOn(ViagemService, 'createQueryListBuilder').and.returnValue(listBuilder);
    spyOn($ionicUtils, 'toTop').and.returnValue($q.when());

    dependency.$scope = scope;
    dependency.ViagemService = ViagemService;
    dependency.$ionicUtils = $ionicUtils;

    ViagensEncerradasCtrl = $controller('viagem.ViagensEncerradasCtrl', dependency);

    ViagensEncerradasCtrl.loadMoreData();

    scope.$digest();

  }));

  it(' - das propriedades iniciais ', function(){

    expect(ViagensEncerradasCtrl.tracker).toBeDefined();
    expect(ViagensEncerradasCtrl.toDelete).toBeDefined();
    expect(ViagensEncerradasCtrl.edit).toBeDefined();
    expect(ViagensEncerradasCtrl.novaViagem).toBeDefined();
    expect(ViagensEncerradasCtrl.deleteViagem).toBeDefined();
    expect(ViagensEncerradasCtrl.loadMoreData).toBeDefined();
    expect(ViagensEncerradasCtrl.search).toBeDefined();
    expect(ViagensEncerradasCtrl.clear).toBeDefined();

    expect(ViagensEncerradasCtrl.motorista.codigo).toBe(_.first(motoristasMock).codigo);
    expect(ViagensEncerradasCtrl.veiculo.codigo).toBe(_.first(veiculosMock).codigo);

  });

  it(' - carregando viagens', function(){


    expect(ViagensEncerradasCtrl.viagens.length).toEqual(viagensMock.length);
    expect(ViagensEncerradasCtrl.canLoad).toBeFalsy();

    ViagensEncerradasCtrl.search({type:'teste'});

    scope.$digest();

    expect(ViagensEncerradasCtrl.viagens.length).toEqual(viagensMock.length);
  });

  it(' - toEdit', function(){
    var toEdit = _.first(viagensMock);

    ViagensEncerradasCtrl.edit(toEdit);

    ViagemService.getToEdit().then(function(data){
      expect(data.codigo).toEqual(toEdit.codigo);

      ViagemService.getToEdit().then(function(data){
        expect(data).toBeNull();
      });
    });
  });

  it(' - toDelete', function(){

    var toDelete = _.first(ViagensEncerradasCtrl.viagens);

    ViagensEncerradasCtrl.toDelete(toDelete);

    expect(toDelete.toDelete).toBeTruthy();

  });

});
