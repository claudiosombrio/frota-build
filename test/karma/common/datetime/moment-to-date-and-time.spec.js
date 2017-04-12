'use strict';

describe('Em relacao aos filtros moment-to-date e moment-to-time', function () {

  var filter, $moment, StringBuilder;

  beforeEach(module('main'));

  beforeEach(inject(function($filter, $injector){
    filter = $filter;
    $moment = $injector.get('$moment');
    StringBuilder = $injector.get('StringBuilder');
  }));

  it(' - filtrando com moment-to-date', function(){
    var today = $moment();

    var expectedResult = $moment().format('DD/MM/YYYY');

    expect(filter('momentToDate')(today)).toEqual(expectedResult);
    expect(filter('momentToDate')(today.valueOf())).toEqual(expectedResult);
  });

  it(' - filtrando com moment-to-time', function(){
    var today = $moment();

    var expectedResult = $moment().format('HH:mm');

    expect(filter('momentToTime')(today)).toEqual(expectedResult);
    expect(filter('momentToTime')(today.valueOf())).toEqual(expectedResult);
  });

});
