// Dummy data

const myRateData = {
  EUR: 1,
  GBP: 0.892269,
  ILS: 3.807714,
  INR: 77.738686,
  JPY: 117.770706,
  RUB: 71.430998,
  USD: 1.093279
};

const myVeryOldData = {
  EUR: 1,
  GBP: 0.737241,
  ILS: 4.230149,
  INR: 71.911659,
  JPY: 130.683188,
  RUB: 79.340793,
  USD: 1.086615
};

// Classes

let rates = null;

class Rate {
  constructor(oldRate, newRate) {
    this.oldRate = oldRate;
    this.newRate = newRate;
    this.oldEurRate = oldRate;
    this.newEurRate = newRate;
  }

  change() {
    return this.newRate - this.oldRate;
  }

  changePct() {
    return this.change() / this.oldRate;
  }

  absPct() {
    return Math.abs(this.changePct());
  }

  setNewBase(baseRateNew, baseRateOld) {
    this.oldRate = this.calcCrossRate(this.oldEurRate, baseRateOld);
    this.newRate = this.calcCrossRate(this.newEurRate, baseRateNew);
  }

  calcCrossRate(rate, baseRate) {
    return (1 / baseRate) * rate;
  }
}

class Rates {
  constructor(oldRates, newRates, baseCcy) {
    this.rates = new Map();
    this.maxPct = 0;
    this.baseCcy = baseCcy;

    for (const rate in oldRates) {
      this.rates.set(rate, new Rate(oldRates[rate], newRates[rate]));
      const absPct = this.rates.get(rate).absPct();
      if (absPct > this.maxPct) this.maxPct = absPct;
    }

    if (baseCcy !== "EUR") {
      this.setNewBase(baseCcy);
    }
  }

  setNewBase(newBase) {
    this.baseCcy = newBase;
    const baseRateOld = this.rates.get(newBase).oldEurRate;
    const baseRateNew = this.rates.get(newBase).newEurRate;

    this.rates.forEach((rate, code) => {
      rate.setNewBase(baseRateNew, baseRateOld);
    });
  }
}

// Change of base ccy

$("#base-ccy").change(function() {
  if (rates !== null) {
    rates.setNewBase(jQuery(this).val());
    populateTable(rates);
  }
});

// Get data and populate on page

const populateTable = () => {
  resetVisualisations();
  rates.rates.forEach((rate, code) => {
    const tblRow = document.getElementById(code);
    if (code === rates.baseCcy) {
      tblRow.hidden = true;
      return;
    } else {
      tblRow.hidden = false;
    }
    tblRow.cells[2].innerText = rate.changePct().toFixed(3);
    tblRow.cells[3].innerText = rate.change().toFixed(3);
    tblRow.cells[4].innerText = rate.oldRate.toFixed(3);
    tblRow.cells[5].innerText = rate.newRate.toFixed(3);
  });
};

let newJson;

const callAjax = endpoint => {
  const access_key = "5dbfa2a644784bd6c65507d03bf060d9";

  //http:

  $.ajax({
    url:
      "//data.fixer.io/api/" +
      endpoint +
      "?access_key=" +
      access_key +
      "&symbols= JPY, ILS, INR, RUB, GBP, USD, EUR",
    dataType: "jsonp",
    success: getExternalData
  });
};

const validateInput = (oldDate, newDate) => {
  let message = null;

  if (oldDate === "" || newDate === "") {
    message = "both dates must be specified";
  } else if (newDate < oldDate) {
    message = "date1 must be less than date 2";
  } else if (oldDate < "2010-01-01") {
    message = "date1 must be after 1st Jan 2010";
  } else if (newDate > new Date().toISOString().slice(0, 10)) {
    message = "dates cannot be in the future";
  }

  return message;
};

const getExternalData = json => {
  const oldDate = $("#date-1").val();
  const newDate = $("#date-2").val();

  if (json === undefined) {
    const validatedInput = validateInput(oldDate, newDate);
    if (validatedInput !== null) {
      alert(validatedInput);
      return;
    }
    if ($("#dummy").is(":checked")) {
      rates = new Rates(myVeryOldData, myRateData, $("#base-ccy").val());
      populateTable(rates);
    } else {
      callAjax(newDate);
    }
  } else if (json.date === newDate) {
    newJson = json;
    callAjax(oldDate);
  } else {
    rates = new Rates(json.rates, newJson.rates, $("#base-ccy").val());
    populateTable(rates);
  }
};

// Page initialisation

$(document).ready(function() {
  $("#date-1").attr("value", "2016-01-03");
  $("#date-2").attr("value", new Date().toISOString().slice(0, 10));
  $("#dummy").prop("checked", true);
});

// Visualisation

const colourRow = (code, changeisPositive) => {
  if (changeisPositive) {
    document.getElementById(code).style.backgroundColor = "#AFD5AA";
  } else {
    document.getElementById(code).style.backgroundColor = "#F6CACB";
  }
};

const sizeCcySymbol = (code, sizefactor) => {
  const cells = document.getElementById(code).cells;
  cells[0].style.fontSize = sizefactor * 5 + 1 + "em";
};

const visualiseData = () => {
  if (rates !== null) {
    rates.rates.forEach((rate, code) => {
      colourRow(code, rate.change() >= 0);
      sizeCcySymbol(code, rate.absPct() / rates.maxPct);
    });
  }
};

const resetVisualisations = () => {
  rates.rates.forEach((rate, code) => {
    document.getElementById(code).style.backgroundColor = "white";
    document.getElementById(code).cells[0].style.fontSize = "1em";
  });
};
