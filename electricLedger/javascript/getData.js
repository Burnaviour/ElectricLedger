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
      var unitPrice = Number(message1[0].value.unitPrice);
      var taxGST = Number(message1[0].value.tax);
      var tax = Math.round((currentUsage * unitPrice) * (taxGST / 100));
      var servicesCharges = Number(message1[0].value.servicesCharges);
      console.log("tax percent ", taxGST / 100)
      console.log("tax ", tax)
      monthlyBill =
        (currentUsage * unitPrice) + tax + servicesCharges;
    }
    console.log("currentUsage", typeof currentUsage)
    console.log("currentUsage*unitPrice", typeof unitPrice)
    console.log("service charges", typeof servicesCharges)

  }

  let data = { monthlyUnits: currentUsage, monthlyBill: monthlyBill, tax: tax };
  console.log(data);
  return data;
};

module.exports = {
  getData: getData,
};
