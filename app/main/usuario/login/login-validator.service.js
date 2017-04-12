'use strict';

(function () {
    angular.module('app.usuario')
        .factory('LoginValidator', LoginValidator);

    LoginValidator.$inject = ['$jsSHA', 'DBClient', '$log', '$q', '$squel'];

    function LoginValidator($jsSHA, DBClient, $log, $q, $squel) {
        var self = this;

        self.validate = validate;

        function validate(usuario){

          if(!usuario.senha){
            return $q.when({valid: null});
          }

          // window.localStorage.senha = usuario.senha;

          return DBClient.query(
            $squel.select()
              .from('usuarios')
              .where('login = ?', usuario.login)
              .where('senha = ?', $jsSHA.criptografar(usuario.senha))
              .toString()
          ).then(function(result) {
              $log.info(result.rows);

              return {valid: result.rows.length > 0};
          });
        }

        return self;
    }

})();
