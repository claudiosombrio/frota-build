'use strict';

(function () {
  angular.module('main')
        .service('DBClient', DBClient);

  DBClient.$inject = ['$injector', '$log', '$q', '$cordovaSQLite', '$rootScope', '$window', '$squel'];

    function DBClient( $injector, $log, $q, $cordovaSQLite, $rootScope, $window, $squel) {
        var self = this;
        var session = null;
        var DATABASE = $injector.get('Database');

        self.query = query;
        self.queryIfNotExistsTable = queryIfNotExistsTable;

        self.fetchAll = fetchAll;
        self.deleteDB = deleteDB;
        self.fetch = fetch;
        self.getSession = getSession;

        function getSession(){
          if(!session){
            if($window.cordova){
              $log.log('BANCO SQLITE');
              session = $cordovaSQLite.openDB(DATABASE.nameDatabase, 1);
            }else{
              $log.log('BANCO WEBSQL');
              session = $window.openDatabase(DATABASE.nameDatabase, '1.0', 'database', -1);
            }
          }

          $rootScope.$broadcast('DB:OK',true);

          return session;
        }

        function query(query, bindings) {
          bindings = typeof bindings !== 'undefined' ? bindings : [];
          var deferred = $q.defer();

          getSession().transaction(function(transaction) {
            transaction.executeSql(query, bindings, function(transaction, result) {
              deferred.resolve(result);
            }, function(transaction, error) {
              deferred.reject(error);
            });
          }, function(err){
            deferred.reject(err);
          });

          return deferred.promise;
        }

        function queryIfNotExistsTable(table, queryToExecute, bindings){
          return query($squel
            .select()
            .from('sqlite_master')
            .field('name')
            .where('type = ?', 'table')
            .where('name = ?', table)
            .toString())
            .then(function(data) {
              var result = fetchAll(data);

              if (result.length===0) {
                return query(queryToExecute, bindings);
              }

              return $q.when([]);
            });
        }

        function fetchAll(result) {
          var output = [];

          for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i));
          }

          return output;
        }

        function fetch(result) {
          if(result.rows.length > 0){
            return result.rows.item(0);
          }else {
            return null;
          }
        }

        function deleteDB(){
          $cordovaSQLite.deleteDB(DATABASE.nameDatabase);
        }

        return self;
    }

})();
