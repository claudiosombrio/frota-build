'use strict';

describe('Em relacao a directive <ck-button-time>', function () {
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
      .append('<ck-button-time ng-model="myTime">')
      .append('</ck-button-time>')
      .toString();

    var myDirective = buildDirective(myTemplate, scope);

    expect(myDirective.find('button').length).toBeGreaterThan(0);
  });

  it(' - transclude', function(){
    var scope = rootScope.$new(true);

    var myTemplate = StringBuilder.create()
      .append('<ck-button-time ng-model="myTime">')
      .append('<edit-item-icon></edit-item-icon>')
      .append('</ck-button-time>')
      .toString();

    var myDirective = buildDirective(myTemplate, scope);

    expect(myDirective.find('i').length).toBeGreaterThan(0);
  });

  it(' - controller', function(){
    var scope = rootScope.$new(true);

    var myTemplate = StringBuilder.create()
      .append('<ck-button-time ng-model="myTime">')
      .append('</ck-button-time>')
      .toString();

    var myDirective = buildDirective(myTemplate, scope);

    var controller = myDirective.controller('ckButtonTime');

    expect(controller.openTimePicker).toBeDefined();
  });
});
