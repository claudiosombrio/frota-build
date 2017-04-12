'use strict';

(function () {
    angular.module('app.common')
        .factory('StringBuilder', StringBuilder);

    StringBuilder.$inject = [];

    function StringBuilder() {
        var self = this;

        self.create = create;

        function create(){
          return new StringBuilderClass();
        }

        return self;
    }

    function StringBuilderClass(){
      var self = this;
      var strings = [];

      self.append = append;
      self.toString = toString;
      self.row = row;
      self.space = space;

      function append(value){
        var toBind = Array.prototype.slice.call(arguments, 1);

        if (value){
          if(toBind.length>0){
            angular.forEach(toBind, function(arg){
              var index = value.indexOf('?');

              if(typeof arg === 'string'){
                arg = '"'+arg+'"';
              }

              value = value.slice(0, index)+arg+value.slice(index+1);
            });
          }

          strings.push(value);
        }
        return self;
      }

      function row(){
        return append('\n');
      }

      function space(){
        return append(' ');
      }

      function toString(){
        return strings.join('');
      }
    }

})();
