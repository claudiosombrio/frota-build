'use strict';

(function () {
    angular.module('app.cidade')
            .service('CidadeService', CidadeService);

    CidadeService.$inject = ['$log', '$state', '$injector', '$q'];

    function CidadeService($log, $state, $injector, $q) {
        var self = this;
        var onlySelectionDriver = true;
        var nextState = 'app.novaviagem';
        var DEFAULT_NEXT_STATE = 'app.novaviagem';
        var DBClient = $injector.get('DBClient');
        var StringBuilder = $injector.get('StringBuilder');

        self.listAll = listAll;
        self.setOnlySelection = setOnlySelection;
        self.isOnlySelection = isOnlySelection;
        self.setNextState = setNextState;
        self.getNextState = getNextState;
        self.changeSelection = changeSelection;

        self.get = get;

        function fetchCidade() {
            return StringBuilder.create()
                    .append('select').space()
                    .append('codigo,').space()
                    .append('descricao').space()
                    .append('from cidade').space()
        }

        function get(codigo) {
            var findDriver = fetchCidade()
                    .append('where codigo =').space()
                    .append(codigo).space()
                    .toString();

            return DBClient.query(findDriver).then(
                    function (data) {
                        return $q.when(DBClient.fetch(data));
                    }, $log.error);
        }

        function listAll(filter, init, deep) {

            var query = fetchCidade();

            var applyLimit = function (sql) {
                if (init < 0 || deep < 1) {
                    return sql;
                }

                return sql.concat('LIMIT ' + init + ', ' + deep);
            };

            angular.forEach(filter, function (value, sql) {
                value ?
                        query.append(sql, value) :
                        query.append(sql);
            });

            return DBClient.query(
                    applyLimit(
                            query
                            .append('order by descricao asc').space()
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

            var STATE_SELECT = 'app.cidade';

            if ($state.current.name !== STATE_SELECT) {
                setNextState($state.current.name);
                setOnlySelection(true);

                $state.go(STATE_SELECT);
            }

        }

        return self;
    }

})();
