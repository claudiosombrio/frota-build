'use strict';

(function () {
    angular.module('app.common')
        .service('$dateTimePicker', $dateTimePicker);

    $dateTimePicker.$inject = ['$cordovaDatePicker', '$moment'];

    function $dateTimePicker($cordovaDatePicker, $moment) {
        var self = this;

        var options = {
          allowOldDates: true,
          allowFutureDates: false,
          doneButtonLabel: 'OK',
          doneButtonColor: '#4a87ee',
          cancelButtonLabel: 'Cancelar',
          cancelButtonColor: '#f8f8f8'
        };

        self.openDate = openDate;
        self.openTime = openTime;

        function openDate(receiver, onTap, customOptions){
          var dateToPicker = new Date();

          if(receiver){
            dateToPicker.setDate(receiver.date());
            dateToPicker.setMonth(receiver.month());
            dateToPicker.setFullYear(receiver.year());
          }

          var dateOption = {
            date: dateToPicker,
            mode: 'date'
          };

          function callback(value){
            if(!receiver){
              receiver = $moment();
            }

            receiver.date(value.getDate());
            receiver.month(value.getMonth());
            receiver.year(value.getFullYear());

            if(angular.isFunction(onTap)){
              onTap();
            }

            return receiver;
          }

          return $cordovaDatePicker
            .show(angular.extend(dateOption, options, customOptions))
            .then(callback);
        }

        function openTime(receiver, onTap, customOptions){
          var timeToPicker = new Date();

          if(receiver){
            timeToPicker.setHours(receiver.hours());
            timeToPicker.setMinutes(receiver.minutes());
          }

          var timeOption = {
            date: timeToPicker,
            mode: 'time'
          };

          function callback(value){
            if(!receiver){
              receiver = $moment();
            }

            receiver.hour(value.getHours());
            receiver.minute(value.getMinutes());

            if(angular.isFunction(onTap)){
              onTap();
            }

            return receiver;
          }

          return $cordovaDatePicker
            .show(angular.extend(timeOption, options, customOptions))
            .then(callback);
        }

        return self;
    }

})();
