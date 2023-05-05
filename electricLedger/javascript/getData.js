const getData = function (message, message1) {
  let currentUsage = 0;
  let monthlyBill = 0;
  let isMonthly = false;
  let MonthlyUsage = 0;

  if (message) {
    let arr = message.map((item) => item.Value.units);
    console.log("arr", arr, "arr len ", arr.length);
    if (arr.length == 0) {
      return false;
    }
    console.log("index after mod", arr.length % 30);

    let index = arr.length % 30;
    if (arr.length > 30) {
      isMonthly = true;
      for (let i = index; i < index + 30; i++) {
        currentUsage += arr[i];
      }

      for (let i = 0; i < index; i++) {
        MonthlyUsage += arr[i];
      }

    }
    else {
      for (let i = 0; i < index; i++) {
        MonthlyUsage += arr[i];
      }
    }

    if (isMonthly) {
      var unitPrice = Number(message1[0].value.unitPrice);
      var taxGST = Number(message1[0].value.tax);
      var tax = Math.round((currentUsage * unitPrice) * (taxGST / 100));
      var servicesCharges = Number(message1[0].value.servicesCharges);
      console.log("tax percent ", taxGST / 100)
      console.log("tax ", tax)
      monthlyBill =
        (currentUsage * unitPrice) + tax + servicesCharges;
    }


  }

  if (isMonthly) {

    let data = { monthlyUnits: currentUsage, isMonthly: true, monthlyBill: monthlyBill, tax: tax, CurrentUsage: MonthlyUsage };
    return data;
  } else {

    let data = { CurrentUsage: MonthlyUsage, isMonthly: false };

    return data;
  }
};

module.exports = {
  getData: getData,
};
