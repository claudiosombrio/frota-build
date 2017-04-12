'use strict';

describe('Em relacao a directive kmFinal', function () {
  var rootScope, compile, StringBuilder;

  beforeEach(module('main'));

  beforeEach(inject(function($compile, $rootScope, $injector){
    rootScope = $rootScope;
    compile = $compile;
    StringBuilder = $injector.get('StringBuilder');
  }));

  function  buildDirective(template, scope){
    var element = compile(template)(scope);

    scope.$digest();

    return element;
  }

  it(' - template', function(){
    var scope = rootScope.$new(true);

    var myTemplate = StringBuilder.create()
      .append('<input-km-final ng-model="kmFinal" km-form="kmForm">')
      .append('</input-km-final>')
      .toString();

    var myDirective = buildDirective(myTemplate, scope);

    scope.$digest();

    expect(myDirective.find('input').length).toBeGreaterThan(0);
    expect(myDirective.find('.km-input').length).toBeGreaterThan(0);
  });


  it(' - gerando ngMessage', function(){

    var scope = rootScope.$new(true);

    var myTemplate = StringBuilder.create()
      .append('<form name="myForm">')
      .append('<input-km-final ng-model="kmFinal" km-form="myForm">')
      .append('</input-km-final>')
      .append('</form>')
      .toString();

    var myDirective = buildDirective(myTemplate, scope);

    scope.$digest();

    expect(myDirective.find('.form-error').length).toBeGreaterThan(0);
    expect(myDirective.find('.ng-hide').length).toBeGreaterThan(0);

    scope.myForm.$setSubmitted(true);
    scope.$digest();

    expect(myDirective.find('.ng-hide').length).toEqual(0);
  });
});
