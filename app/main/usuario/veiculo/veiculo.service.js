'use strict';

(function () {
    angular.module('app.usuario')
            .service('VeiculoService', VeiculoService);

    VeiculoService.$inject = ['DBClient', '$log', '$squel', '$state', '$q'];

    function VeiculoService(DBClient, $log, $squel, $state, $q) {
        var self = this;
        var nextState = 'app.inicio';
        var onlySelection = false;

        self.listAll = listAll;

        self.setOnlySelection = setOnlySelection;
        self.isOnlySelection = isOnlySelection;
        self.setNextState = setNextState;
        self.getNextState = getNextState;
        self.changeSelection = changeSelection;
        self.update = update;

        self.getVeiculo = getVeiculo;

        function addFieldsAll(query, alias) {
            alias = alias ? alias + '.' : '';

            return query
                    .field(alias + 'codigo')
                    .field(alias + 'descricao')
                    .field(alias + 'placa')
                    .field(alias + 'fabricante')
                    .field(alias + 'km');
        }

        function update(veiculo) {
          var sqlUpdate = $squel.update()
            .table('veiculos')
            .set('km', veiculo.km)
            .where('codigo = ?', veiculo.codigo);
          return DBClient.query(sqlUpdate.toString());
        }

        function listAll(filter, init, deep) {

            var query = addFieldsAll($squel.select().from('veiculos', 'v'), 'v');

            var applyLimit = function (sql) {
                if (init < 0 || deep < 1) {
                    return sql;
                }

                return sql.concat(' LIMIT ' + init + ', ' + deep);
            };

            angular.forEach(filter, function (value, sql) {
                value ?
                        query.where(sql, value) :
                        query.where(sql);
            });

            return DBClient.query(
                    applyLimit(
                            query
                            .order('descricao')
                            .toString()
                            )
                    ).then(DBClient.fetchAll, $log.error);
        }

        function getVeiculo(codigo) {

            var query = addFieldsAll($squel.select().from('veiculos', 'v'), 'v');

            return DBClient.query(query.where('v.codigo = ?', codigo).toString())
                    .then(function (data) {
                        return $q.when(DBClient.fetch(data));
                    }, $log.error);

        }

        function setOnlySelection(value) {
            onlySelection = value;
        }

        function isOnlySelection() {
            return onlySelection;
        }

        function setNextState(value) {
            nextState = value;
        }

        function getNextState() {
            return nextState;
        }

        function changeSelection() {
            var STATE_SELECT = 'app.veiculo';

            if ($state.current.name !== STATE_SELECT) {
                setNextState($state.current.name);
                setOnlySelection(false);

                $state.go(STATE_SELECT);
            }
        }

        return self;
    }

})();
