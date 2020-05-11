/* global rangeSlider */

import baseWidget from './baseWidget.js';
import { settings, select } from '../settings.js';
import utils from '../utils.js';


export class hourPicker extends baseWidget {
  constructor(wrapper) {
    super(wrapper, settings.hours.open);
    const thisWidget = this;
    
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(
      select.widgets.hourPicker.input
    );

    thisWidget.dom.output = thisWidget.dom.wrapper.querySelector(
      select.widgets.hourPicker.output
    );

    thisWidget.value = thisWidget.dom.input.value;
    
    thisWidget.initPlugin();  
  }

  initPlugin() {
    const thisWidget = this;
    rangeSlider.create(thisWidget.dom.input);
    thisWidget.dom.input.addEventListener('input', function () {
      thisWidget.value = thisWidget.dom.input.value;
    });  
  }

  parseValue(newValue) {
    return utils.numberToHour(newValue);
  }

  isValid() {
    return true;
  }

  renderValue() {
    const thisWidget = this;
    thisWidget.dom.output.innerHTML = thisWidget.value;
  }
}
