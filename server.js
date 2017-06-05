
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan');
	
app.use(express.static(path.join(__dirname, 'public')));
	
var bittrex = require('./js/node.bittrex.api.js');
bittrex.options({
    'apikey': '0be3cd502e804ee18d3a2f99003128d0',
    'apisecret': '8aa9176bd00546b8b6a49e1b428d85c2',
    'stream': false,
    'verbose': false,
    'cleartext': false
});

    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";


app.get('/', function (req, res) {
    res.render('index.html');  
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
module.exports = app ;

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

function timeToReturn(res, currencies){
	if(currencies["obtainedPrices"] == currencies["currenciesQuantity"]){		
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(JSON.stringify(currencies).toString());
	}	
}

function checkRate(tickerData, currencies, res) {
    if (tickerData.Currency == "BTC") {	
		tickerData.BtcValue = tickerData.Balance;
		currencies["obtainedPrices"]++;	
		currencies[tickerData.Currency] = tickerData;	
		timeToReturn(res, currencies);		
    }
    else {
        var url = "https://bittrex.com/api/v1.1/public/getticker?market=BTC-" + tickerData.Currency;
        bittrex.sendCustomRequest(url, function (marketData) {
   
		var rate = marketData.result.Last;
		tickerData.BtcValue = tickerData.Balance * rate;
		currencies["obtainedPrices"]++;
		currencies[tickerData.Currency] = tickerData;
		timeToReturn(res, currencies);
        });	
    }		
}
