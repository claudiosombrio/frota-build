'use strict';

describe('Em relacao ao string builder', function () {
  var sb;

  beforeEach(module('main'));

  beforeEach(inject(function($injector){
    sb = $injector.get('StringBuilder');
  }));

  it('teste basico', function(){
    var name =
      sb.create()
        .append('Marlon ')
        .append('Henrique ')
        .append('de ')
        .append('Souza')
        .toString();

    expect(name).toBe('Marlon Henrique de Souza');
  });

});
