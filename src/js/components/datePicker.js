/* global flatpickr */


import baseWidget from './baseWidget.js';
import utils from '../utils.js';
import { settings, select } from '../settings.js';


export class datePicker extends baseWidget {
  constructor(wrapper) {
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(
      select.widgets.datePicker.input
    );

    thisWidget.initPlugin();
  }

  initPlugin() {
    const thisWidget = this;

    thisWidget.minDate = new Date(thisWidget.value);
    thisWidget.maxDate = utils.addDays(
      thisWidget.minDate,
      settings.datePicker.maxDaysInFuture
    );

    flatpickr(thisWidget.dom.input, {
      defaultDate: thisWidget.value,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      locale: {
        firstDayOfWeek: 1,
      },
      disable: [
        function (date) {
          // return true to disable
          return (date.getDay() === 1);
        },
      ],
      onChange: function(selectedDates, dateStr){ 
        thisWidget.value = dateStr;
      }});
      
  }

  parseValue(value) {
    return value;
  }

  isValid() {
    return true;
  }

  renderValue() {
    
  }
}
