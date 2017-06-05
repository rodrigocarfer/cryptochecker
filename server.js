
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan');
	
app.use(express.static(__dirname + '/public'));
   
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
    res.render('index.html');  
});
// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

module.exports = app ;

var bittrex = require('js/node.bittrex.api.js');

bittrex.options({
    'apikey': '0be3cd502e804ee18d3a2f99003128d0',
    'apisecret': '8aa9176bd00546b8b6a49e1b428d85c2',
    'stream': false,
    'verbose': false,
    'cleartext': false
});

app.get('/getbalances', function (req, res) {
	
	var currencies = {obtainedPrices: 0, currenciesQuantity: -1};
	bittrex.getbalances(function (data) {
	currencies["currenciesQuantity"] = data.result.length;
    data.result.forEach(function (tickerData) {
        if (tickerData.Balance > 0) {		
            checkRate(tickerData, currencies, res);
        }
		else {
			currencies["obtainedPrices"]++;
		}			
    });
	});	
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

function timeToReturn(res, currencies){
	if(currencies["obtainedPrices"] == currencies["currenciesQuantity"]){		
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(JSON.stringify(currencies).toString());
	}	
}

function prepareData(data){
	data.CryptoAddress = undefined;
	data.Pending = undefined;
	return data;
}

function checkRate(tickerData, currencies, res) {
    if (tickerData.Currency == "BTC") {	
		tickerData.BtcValue = tickerData.Balance;
		currencies["obtainedPrices"]++;	
		tickerData
		currencies[tickerData.Currency] = prepareData(tickerData);	
		timeToReturn(res, currencies);		
    }
    else {
        var url = "https://bittrex.com/api/v1.1/public/getticker?market=BTC-" + tickerData.Currency;
        bittrex.sendCustomRequest(url, function (marketData) {
   
		var rate = marketData.result.Last;
		tickerData.BtcValue = tickerData.Balance * rate;
		currencies["obtainedPrices"]++;
		currencies[tickerData.Currency] = prepareData(tickerData);	
		timeToReturn(res, currencies);
        });	
    }		
}
