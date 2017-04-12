'use strict';

(function () {
    angular.module('app.roteiro')
            .service('RoteiroService', RoteiroService);

    RoteiroService.$inject = ['DBClient', '$log', '$squel', '$state', '$injector', '$localStorage'];

    function RoteiroService(DBClient, $log, $squel, $state, $injector, $localStorage) {
        var self = this;
        var nextState = 'app.novaviagem';
        var onlySelection = true;
        var StringBuilder = $injector.get('StringBuilder');
        var label = 'Nova Viagem!';

        self.listAll = listAll;

        self.setOnlySelection = setOnlySelection;
        self.isOnlySelection = isOnlySelection;
        self.setNextState = setNextState;
        self.getNextState = getNextState;
        self.changeSelection = changeSelection;
        self.getRoteiro = getRoteiro;
        self.getLabel = getLabel;
        self.setLabel = setLabel;

        function setLabel(_label){
          label = _label;
        }
        function getLabel(){
          return label;
        }

        function addFieldsAll() {

          return  StringBuilder.create()
                    .append('select').space()
                    .append('r.codigo codigoRoteiro,').space()
                    .append('r.codigoMotorista codigo,').space()
                    .append('r.codigoVeiculo,').space()
                    .append('r.saida,').space()
                    .append('r.localSaida,').space()
                    .append('r.chegada,').space()
                    .append('u.codigo as usuario,').space()
                    .append('u.cpf,').space()
                    .append('u.email,').space()
                    .append('u.login,').space()
                    .append('m.profissional,').space()
                    .append('m.nome nome,').space()
                    .append('c.descricao destino,').space()
                    .append('r.codigoCidade').space()
                    .append('from roteiroViagem r, cidade c, motoristas m, usuarios u').space()
                    .append('where c.codigo = r.codigoCidade').space()
                    .append('and m.codigo = r.codigoMotorista').space()
                    .append('and m.profissional = u.profissional').space()
                    .append('and r.codigoVeiculo =').space()
                    .append($localStorage.getVeiculo().codigo || -1).space();
        }

        function getRoteiro(codigo){
          var query = addFieldsAll();
          if(codigo === undefined || codigo === 'undefined'){
            codigo = -1;
          }
          query.append('and r.codigo = ' + codigo).space()
          query.append('order by r.saida asc').space();

          return DBClient.query(query.toString()).then(DBClient.fetchAll, $log.error);
        }

        function listAll(init, deep) {

            var query = addFieldsAll();
            query.append('and strftime(\'%Y-%m-%d\', r.saida) = date(\'now\', \'localtime\')').space()
            query.append('and NOT EXISTS(select 1 from viagens, roteiroViagem where roteiroViagem.codigo = viagens.codigoRoteiro) ').space()
            query.append('order by r.saida asc').space();

            var applyLimit = function (sql) {
                if (init < 0 || deep < 1) {
                    return sql;
                }

                return sql.concat(' LIMIT ' + init + ', ' + deep);
            };

            // angular.forEach(filter, function (value, sql) {
            //     value ?
            //             query.where(sql, value) :
            //             query.where(sql);
            // });
            console.log(query.toString())
            return DBClient.query(
                    applyLimit(
                            query
                            .toString()
                            )
                    ).then(DBClient.fetchAll, $log.error);
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
            var STATE_SELECT = 'app.roteiro';

            if ($state.current.name !== STATE_SELECT) {
                setNextState($state.current.name);
                setOnlySelection(false);

                $state.go(STATE_SELECT);
            }
        }

        return self;
    }

})();
