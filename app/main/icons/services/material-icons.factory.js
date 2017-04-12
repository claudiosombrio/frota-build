'use strict';

(function () {
    angular.module('material-design-icons')
        .factory('MaterialIconsFactory', MaterialIconsFactory);

    MaterialIconsFactory.$inject = ['TEMPLATE_ICONS'];

    function MaterialIconsFactory(TEMPLATE_ICONS) {
        var self = this;

        self.generateByName = generateByName;

        function generateByName(name){
          if(typeof name !== 'string'){
            throw Error('Invalid parameter name!');
          }

          return new Icon(name);
        }

        function Icon(name){
          this.template = buildTemplate(name);

          this.scope = {};
          this.scope.class = '@';
        }

        function buildTemplate(name){
          var TAG_OPEN = '<i class="material-icons {{class}}" style="vertical-align: middle; display: inline-block;">',
            TAG_CLOSE = '</i>';

          var template = TEMPLATE_ICONS[name.toUpperCase()];

          if(!template){
            throw Error('Icon name invalid!');
          }

          return TAG_OPEN.concat(template).concat(TAG_CLOSE);
        }

        return self;
    }

})();
