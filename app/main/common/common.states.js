'use strict';
( function () {

  angular.module('app.common')
    .config(function ($stateProvider, $urlRouterProvider) {

      var stateFactory = {};

      stateFactory.of = of;
      stateFactory.ofCacheFalse = ofCacheFalse;

      function of(url, templateUrl, controller, options){
        var state = _.chain({})
         .set('url', url)
         .set('views.pageContent.templateUrl',templateUrl)
         .set('views.pageContent.controller',controller)
         .value();

        return angular.extend(state, options);
      }

      function ofCacheFalse(url, templateUrl, controller){
        return of(url, templateUrl, controller, {cache: false});
      }

      $urlRouterProvider.otherwise('/main/inicio');
      $stateProvider
        .state('app',{
          url: '/main',
          abstract: true,
          templateUrl: 'main/common/menu/menu.html',
          controller: 'common.MenuCtrl as vm'
        })
        .state('app.inicio', stateFactory.ofCacheFalse('/inicio', 'main/view-inicial/inicio.html', 'main.InicioCtrl as vm'))
        .state('app.usuario', stateFactory.ofCacheFalse('/usuario', 'main/usuario/motorista/select-motorista.html', 'usuario.SelectMotoristaCtrl as vm'))
        .state('app.passageiro', stateFactory.ofCacheFalse('/usuario/passageiro', 'main/usuario/passageiros/passageiros.html', 'usuario.PassageiroCtrl as vm'))
        .state('app.cidade', stateFactory.ofCacheFalse('/cidade', 'main/usuario/cidade/cidade.html', 'cidade.SelectCidadeCtrl as vm'))
        .state('app.veiculo', stateFactory.ofCacheFalse('/usuario/veiculo', 'main/usuario/veiculo/select-veiculo.html', 'usuario.SelectVeiculoCtrl as vm'))
        .state('app.roteiro', stateFactory.ofCacheFalse('/usuario/roteiro', 'main/usuario/roteiro/select-roteiro.html', 'usuario.SelectRoteiroCtrl as vm'))
        .state('app.viagens', stateFactory.ofCacheFalse('/viagens', 'main/viagem/viagens-encerradas.html', 'viagem.ViagensEncerradasCtrl as vm'))
        .state('app.novaviagem', stateFactory.ofCacheFalse('/nova-viagem', 'main/viagem/emviagem/nova-viagem.html', 'viagem.NovaViagemCtrl as vm'))
        .state('app.viajando', stateFactory.ofCacheFalse('/viajando', 'main/viagem/emviagem/viajando.html', 'viagem.ViajandoCtrl as vm'))
        .state('app.encerrando-viagem', stateFactory.ofCacheFalse('/encerrando-viagem', 'main/viagem/emviagem/encerrar-viagem.html', 'viagem.EncerrarViagemCtrl as vm'))
        .state('app.configuracao', stateFactory.of('/configuracao', 'main/common/configuracao/configuracao.html', 'common.ConfiguracaoCtrl as vm'))
        .state('app.sincronizar', stateFactory.ofCacheFalse('/sincronizar', 'main/sincronizar/sincronizar.html', 'SincronizarCtrl as vm'))
        .state('app.sincronizando', stateFactory.ofCacheFalse('/sincronizando', 'main/sincronizar/sincronizando.html', 'SincronizandoCtrl as vm'))
        .state('app.cad-viagem', stateFactory.of('/cad-viagem', 'main/viagem/cadastro-viagem.html', 'viagem.CadastroViagemCtrl as vm'))
    });
})();
