import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import amountWidget from './amountWidget.js';
import { datePicker } from './datePicker.js';
import { hourPicker } from './HourPicker.js';

export class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    const urls = {
      booking:
        settings.db.url +
        '/' +
        settings.db.booking +
        '?' +
        params.booking.join('&'),
      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsCurrent.join('&'),
      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponse) {
        const bookingsResponse = allResponse[0];
        const eventsCurrentResponse = allResponse[1];
        const eventsRepeatResponse = allResponse[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings, eventsCurrent, eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;

    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily');
      for (
        let loopDate = minDate;
        loopDate <= maxDate;
        loopDate = utils.addDays(loopDate, 1)
      ) {
        thisBooking.makeBooked(
          utils.dateToStr(loopDate),
          item.hour,
          item.duration,
          item.table
        );
      }
    }

    thisBooking.updateDom();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    if (typeof thisBooking.booked[date][startHour] == 'undefined') {
      thisBooking.booked[date][startHour] = [];
    }

    thisBooking.booked[date][startHour].push(table);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDom() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(
          tableId
        ) > -1
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  sendReservation() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: [],
      ppl: thisBooking.peopleAmount.value,
      duration: thisBooking.dom.hoursAmount.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) {
        payload.starters.push(starter.value);
      }
    }

    for (let table of thisBooking.dom.tables) {
      const tableBooked = table.classList.contains(
        classNames.booking.tableSelected
      );
      if (tableBooked) {
        thisBooking.tableId = table.getAttribute(
          settings.booking.tableIdAttribute
        );
        thisBooking.tableId = parseInt(thisBooking.tableId);

        payload.table.push(thisBooking.tableId);
        //console.log(thisBooking.tableId);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisBooking.makeBooked(
          payload.date,
          payload.hour,
          payload.duration,
          payload.table
        );
        console.log('booked: ', thisBooking.booked[payload.date]);
      });
    thisBooking.clearForm();
  }

  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );
    thisBooking.dom.submitButton = thisBooking.dom.wrapper.querySelector(
      select.booking.bookTable
    );
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(
      select.booking.bookPhone
    );
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(
      select.booking.bookAddress
    );
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.starters
    );
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new amountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new amountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new datePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new hourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDom();
    });
    thisBooking.dom.submitButton.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.sendReservation();
    });

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {

        if (table.classList.contains(classNames.booking.tableBooked)) {
          return;
        }

        for (let table of thisBooking.dom.tables) {
          table.classList.remove(classNames.booking.selected);
        }

        table.classList.add(classNames.booking.selected);
        thisBooking.tableSelected = table.getAttribute(settings.booking.tableIdAttribute);
      });
    }
  }
  clearForm() {
    const thisBooking = this;

    thisBooking.peopleAmount.value = 1;
    thisBooking.hoursAmount.value = 1;

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) {
        starter.checked = false;
      }
    }
    thisBooking.dom.starters = [];
    thisBooking.dom.phone.value = '';
    thisBooking.dom.address.value = '';
  }
}
