'use strict';

(function () {
    angular.module('app.database')
        .factory('TablesFactory', TablesFactory);

    TablesFactory.$inject = ['StringBuilder'];

    function TablesFactory(StringBuilder) {

      function TablesFactoryClass(){
          var self = this;

          self.newTable = newTable;

          function newTable(name, cols){
            var sql = StringBuilder.create()
                        .append('CREATE TABLE IF NOT EXISTS ')
                        .append(name)
                        .append(' ( ');

            angular.forEach(cols, function(col, nameCol){
              sql.append(nameCol)
                .append(' ')
                .append(col)
                .append(_.findLastKey(cols)!==nameCol ? ', ':' )')
            });

            return sql.toString();
          }

        }

        return new TablesFactoryClass();
    }
})();
