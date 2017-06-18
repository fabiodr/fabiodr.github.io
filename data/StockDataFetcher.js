var d3 = require('d3');

window.stockData = null;

window.StockDataFetcher = new function () {
  var that = this;

  this.prepareStockData = function (data) {
    var processedData = [];
    //const dateFormat = d3.time.format('%d/%m/%Y');

    processedData.push({ name: 'Sectors', superSector: '' });

    data.forEach(function (d) {
      if (!d.name) return;

      //d.date = dateFormat.parse(d.date);
      d.companyId = +d.companyId;
      d.marketCap = +d.marketCap;
      d.price = +d.price;
      d.change = +d.change
      d.volume = +d.volume;

      if (!processedData.some(function (item) { return item.name == d.superSector && !item.companyId })) {
        processedData.push({ name: d.superSector, superSector: 'Sectors' });
      }

      processedData.push(d);
    });

    return processedData;
  };

  this.get = function (callback) {
    d3.csv('/assets/data/GetDayStockData.csv', function (data) {
      //data = data.slice(0, 50);
      window.stockData = that.prepareStockData(data);
      console.log(window.stockData);
      callback(window.stockData);
    });
  }
}
