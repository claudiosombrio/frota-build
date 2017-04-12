'use strict';

(function () {
    angular.module('app.common')
        .provider('$localStorage', $localStorage);

    function $localStorage() {
        var self = this;
        var VARIABLE_IN_STORAGE = {};
        var instance;

        self.setStorage = setStorage;

        function setStorage(value){
          VARIABLE_IN_STORAGE = value;
        }

        self.$get = function($moment){
          return createInstance($moment);
        };

        function createInstance($moment){
          instance = {};

          angular.forEach(VARIABLE_IN_STORAGE, function(object, field){
            var fieldFormatted = suffixFactory(field);

            switch(object.type){
              case 'object':
                objectFactory(field, fieldFormatted);
                break;
              case 'moment':
                momentFactory(field, fieldFormatted, $moment);
                break;
              case 'string':
                stringFactory(field, fieldFormatted);
                break;
              case 'boolean':
                booleanFactory(field, fieldFormatted);
                break;
              case 'number':
                numberFactory(field, fieldFormatted);
                break;
            }
          });

          return instance;
        }

        function suffixFactory(field){
          var words = field.toLowerCase().split('_');

          return _.chain(words)
                  .map(_.capitalize)
                  .reduce(function(result, word){
                    return result.concat(word);
                  })
                  .value();
        }

        function objectFactory(field, fieldFormatted){
          instance['get'.concat(fieldFormatted)] = function(){
            var result = getItem(VARIABLE_IN_STORAGE[field].name);

            return result !=='undefined' ? JSON.parse(result) : null;
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              JSON.stringify(value));
          };
        }

        function momentFactory(field, fieldFormatted, $moment){
          instance['get'.concat(fieldFormatted)] = function(){
            var result = getItem(VARIABLE_IN_STORAGE[field].name);
            return !result ? $moment(): $moment(result);
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              value.toString());
          };
        }

        function numberFactory(field, fieldFormatted){
          instance['get'.concat(fieldFormatted)] = function(){
            return Number(getItem(VARIABLE_IN_STORAGE[field].name));
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              value);
          };
        }

        function stringFactory(field, fieldFormatted){
          instance['get'.concat(fieldFormatted)] = function(){
            return getItem(VARIABLE_IN_STORAGE[field].name);
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              value);
          };
        }

        function booleanFactory(field, fieldFormatted){
          instance['get'.concat(fieldFormatted)] = function(){
            return getItem(VARIABLE_IN_STORAGE[field].name==='true');
          };

          instance['set'.concat(fieldFormatted)] = function(value){
            setItem(
              VARIABLE_IN_STORAGE[field].name,
              value+'');
          };
        }

        function getItem(key){
          return window.localStorage.getItem(key);
        }

        function setItem(key, value){
          window.localStorage.setItem(key, value);
        }

        return self;
    }

})();
