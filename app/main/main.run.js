'use strict';

(function () {
    angular.module('main')
        .run(mainRun);

    mainRun.$inject = ['$state', '$ionicHistory', 'LoginEventEmitter'];

    function mainRun($state, $ionicHistory, LoginEventEmitter) {
      $state.goNoHistory = goNoHistory;
      $state.goIfSessionValid = goIfSessionValid;
      $state.goIfSessionValidNoHistory = goIfSessionValidNoHistory;

      function goNoHistory(to){
        $ionicHistory.nextViewOptions({
          disableBack: true
        });

        $state.go(to);
      }

      function goIfSessionValid(to){
        LoginEventEmitter.onStateGo().then(function(valid){
          if(valid){
            $state.go(to);
          }
        });
      }

      function goIfSessionValidNoHistory(to){
        LoginEventEmitter.onStateGo().then(function(valid){
          if(valid){
            $state.goNoHistory(to);
          }
        });
      }

    }
})();
