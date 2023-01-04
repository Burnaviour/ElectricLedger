const getData = function (message, message1) {
  let currentUsage = 0;
  let monthlyBill = 0;
  console.log("message", message1);

  if (message) {
    let arr = message.map((item) => item.Value.units);
    console.log("arr", arr, "arr len ", arr.length);
    console.log("index after mod", arr.length % 30);

    let index = arr.length % 30;

    for (let i = 0; i < index; i++) {
      currentUsage += arr[i];
    }
    if (message1) {
      monthlyBill =
        currentUsage * message1[0].value.unitPrice +
        message1[0].value.servicesCharges +
        message1[0].value.tax;
    }
  }

  console.log("current Usage", currentUsage);
  console.log("current bill", monthlyBill);
  let data = { currentUsage: currentUsage, monthlyBill: monthlyBill };
  return data;
};

module.exports = {
  getData: getData,
};
