'use strict';

(function () {
    angular.module('app.usuario')
            .service('MotoristaService', MotoristaService);

    MotoristaService.$inject = ['$log', '$state', '$injector', '$q'];

    function MotoristaService($log, $state, $injector, $q) {
        var self = this;
        var onlySelectionDriver = false;
        var nextState = 'app.veiculo';
        var DEFAULT_NEXT_STATE = 'app.veiculo';
        var DBClient = $injector.get('DBClient');
        var StringBuilder = $injector.get('StringBuilder');

        self.listAll = listAll;
        self.setOnlySelection = setOnlySelection;
        self.isOnlySelection = isOnlySelection;
        self.setNextState = setNextState;
        self.getNextState = getNextState;
        self.changeSelection = changeSelection;
        self.getPorProfissional = getPorProfissional;

        self.get = get;

        function motoristaJoinUsuario() {
            return StringBuilder.create()
                    .append('select').space()
                    .append('m.codigo,').space()
                    .append('m.nome,').space()
                    .append('m.dataNascimento,').space()
                    .append('u.codigo as usuario,').space()
                    .append('u.cpf,').space()
                    .append('u.email,').space()
                    .append('u.login,').space()
                    .append('u.codigoCidade codigoCidade').space()
                    .append('from motoristas m, usuarios u').space()
                    .append('where m.profissional = u.profissional').space();
        }

        function get(codigo) {
            var findDriver = motoristaJoinUsuario()
                    .append('and m.codigo = ?', codigo).space()
                    .append('order by m.nome asc').space()
                    .toString();

            return DBClient.query(findDriver).then(
                    function (data) {
                        return $q.when(DBClient.fetch(data));
                    }, $log.error);
        }

        function getPorProfissional(codigo) {
            var findDriver = motoristaJoinUsuario()
                    .append('and m.profissional = ?', codigo).space()
                    .append('order by m.nome asc').space()
                    .toString();

            return DBClient.query(findDriver).then(
                    function (data) {
                        return $q.when(DBClient.fetch(data));
                    }, $log.error);
        }

        function listAll(filter, init, deep) {

            var query = motoristaJoinUsuario();
            var applyLimit = function (sql) {
                if (init < 0 || deep < 1) {
                    return sql;
                }

                return sql.concat('LIMIT ' + init + ', ' + deep);
            };

            angular.forEach(filter, function (value, sql) {
                query.append(' AND ');
                value ?
                        query.append(sql, value) :
                        query.append(sql);
            });

            return DBClient.query(
                    applyLimit(
                            query
                            .append('order by m.nome asc').space()
                            .toString()
                            )
                    ).then(DBClient.fetchAll, $log.error);
        }

        function setOnlySelection(value) {
            onlySelectionDriver = value;
        }

        function isOnlySelection() {
            var retorno = onlySelectionDriver;

            onlySelectionDriver = false;

            return retorno;
        }

        function setNextState(value) {
            nextState = value;
        }

        function getNextState() {
            var retorno = nextState;

            nextState = DEFAULT_NEXT_STATE;

            return retorno;
        }

        function changeSelection() {

            var STATE_SELECT = 'app.usuario';

            if ($state.current.name !== STATE_SELECT) {
                setNextState($state.current.name);
                setOnlySelection(true);

                $state.go(STATE_SELECT);
            }

        }

        return self;
    }

})();
