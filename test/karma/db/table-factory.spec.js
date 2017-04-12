'use strict';

describe('Em relacao ao servico de construcao do banco ', function () {

  var TablesFactory, TABLES;

  beforeEach(module('main'));

  beforeEach(inject(function($injector){
    TablesFactory = $injector.get('TablesFactory');
    TABLES = $injector.get('Tables');
  }));

  it(' - create table', function(){
    angular.forEach(TABLES.COLS, function(table, nameTable){
      var sqlCreateTable = TablesFactory.newTable(nameTable, table);

      expect(sqlCreateTable.indexOf('CREATE TABLE IF NOT EXISTS')).toBeGreaterThan(-1);

      angular.forEach(table, function(attrCol, colName){
        expect(sqlCreateTable.indexOf(attrCol)).toBeGreaterThan(-1);
        expect(sqlCreateTable.indexOf(colName)).toBeGreaterThan(-1);
      });
    });
  });


});
