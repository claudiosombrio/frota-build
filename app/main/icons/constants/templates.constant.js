'use strict';

(function () {
    angular.module('material-design-icons')
        .constant('TEMPLATE_ICONS', new TemplateIcons());

    function TemplateIcons() {
      var TEMPLATES = {};

      TEMPLATES.CALENDAR = '&#xE24F;';
      TEMPLATES.CANCEL = '&#xE888;';
      TEMPLATES.CAR = '&#xE531;';
      TEMPLATES.CLOCK = '&#xE190;';
      TEMPLATES.DELETE = '&#xE872;';
      TEMPLATES.DONE = '&#xE876;';
      TEMPLATES.EDIT = '&#xE254;';
      TEMPLATES.PLUS = '&#xE148;';
      TEMPLATES.SAVE = '&#xE161;';
      TEMPLATES.HOME = '&#xE88A;';
      TEMPLATES.USER = '&#xE7FD;';
      TEMPLATES.CONFIG = '&#xE8B8;';
      TEMPLATES.SYNCHRONIZE = '&#xE8D6;';
      TEMPLATES.TRAVELING = '&#xE55D;';
      TEMPLATES.EXIT = '&#xE879;';
      TEMPLATES.TRAVELS ='&#xE8F8;';
      TEMPLATES.NEWTRAVEL = '&#xE613;';
      TEMPLATES.FINISHTRAVEL = '&#xE0C8;';
      TEMPLATES.NEXT = '&#xE01F;';
      TEMPLATES.BACK = '&#xE020;';
      TEMPLATES.PLAY = '&#xE037;';
      TEMPLATES.CLEAR = '&#xE14C;';
      TEMPLATES.DRIVER = '&#xE637;';
      TEMPLATES.LOCATION_CITY = 'location_city';
      TEMPLATES.DONE = 'done';
      TEMPLATES.PEOPLE = 'people';
      TEMPLATES.EDIT_LOCATION = 'my_location';

      return TEMPLATES;
    }


})();
