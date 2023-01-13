const getData = function (message, message1) {
  let currentUsage = 0;
  let monthlyBill = 0;

  if (message) {
    let arr = message.map((item) => item.Value.units);
    console.log("arr", arr, "arr len ", arr.length);
    if (arr.length == 0) {
      return false;
    }
    console.log("index after mod", arr.length % 30);

    let index = arr.length % 30;

    for (let i = 0; i < index; i++) {
      currentUsage += arr[i];
    }
    if (message1) {
      var tax = Math.round((currentUsage * message1[0].value.unitPrice) * message1[0].value.tax);
      monthlyBill =
        (currentUsage * message1[0].value.unitPrice) + tax +
        message1[0].value.servicesCharges;
    }
  }

  let data = { monthlyUnits: currentUsage, monthlyBill: monthlyBill, tax: tax };
  console.log(data);
  return data;
};

module.exports = {
  getData: getData,
};
