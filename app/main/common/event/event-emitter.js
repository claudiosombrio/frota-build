'use strict';

(function(){

  angular.module('app.common')
    .factory('EventEmitter', EventEmitterService);

  function EventEmitterService(){
    return EventEmitter;
  }

  function EventEmitter(){

    var self = this;
    var events = [];

    self.event = event;
    self.on = on;
    self.getEvents = getEvents;

    function on(name, anotherEvent){
      return anotherEvent ? self[name](anotherEvent) : self[name]();
    }

    function event(name, handle){
      events.push(name);
      self[name] = handle;
    }

    function getEvents(){
      return events;
    }

    //shorthands
    self.eventSave = eventSave;
    self.eventStateGo = eventStateGo;
    self.onSave = onSave;
    self.onStateGo = onStateGo;

    function eventSave(handle){
      event('onSave', handle);
    }

    function eventStateGo(handle){
      event('onStateGo', handle);
    }

    function onSave(anotherEvent){
      return on('onSave', anotherEvent);
    }

    function onStateGo(anotherEvent){
      return on('onStateGo',anotherEvent);
    }
  }

})();
