'use strict';

describe('Em relacao a lib de icones ', function () {
  var iconsMock = readJSON('test/mock/icones/icones.json')
  var compile;
  var scope;

  beforeEach(module('material-design-icons'));

  beforeEach(inject(function($compile, $rootScope){
    compile = $compile;
    scope = $rootScope.$new(true);
  }));

  function getCompiledElement(icon){
    var element = compile(icon)(scope);

    scope.$digest();

    return element;
  }

  it('compilando diretivas', function(){
    var element;
    angular.forEach(iconsMock, function(icon){
      element = getCompiledElement(icon);

      expect(element.find('i').length).toBeGreaterThan(0);
    });
  });

});
