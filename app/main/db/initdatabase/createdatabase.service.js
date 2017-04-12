'use strict';

(function () {
    angular.module('app.database')
        .service('CreateDatabase', CreateDatabase);

    CreateDatabase.$inject = ['$injector', 'TablesFactory', '$log', '$q'];

    function CreateDatabase($injector, TablesFactory, $log, $q) {

        var TABLES = $injector.get('Tables');
        var DBClient = $injector.get('DBClient');

        var self = this;

        self.init = init;

        function init(){
          return buildTables();
        }

        function buildTables(){
          var promises = [];

          angular.forEach(TABLES.COLS, function(table, nameTable){
            promises.push(
              DBClient.queryIfNotExistsTable(
                nameTable,
                TablesFactory.newTable(nameTable, table)
              ).then($log.log, $log.error)
            );
          });

          return $q.all(promises);
        }

        return self;
    }
})();
