
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    morgan  = require('morgan'),
	bodyParser = require('body-parser');
	
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

var lastTimeDbUpdated = new Date();
var updateFrequency = (process.env.DB_UPDATE_FREQUENCY || 5) * 60000;
   
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

var bittrex = require('./public/js/node.bittrex.api.js');
var MongoClient = require('mongodb').MongoClient;
var url = MONGOLAB_URI || "mongodb://localhost:27017/mydb";

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

app.get('/getBtnAmt', function (req, res) {
	MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  db.collection("btnAmt").find({}, function(err, result) {
    if (err) throw err;
    	res.writeHead(200, {"Content-Type": "text/html"});
		res.end(JSON.stringify(result).toString());
    db.close();
  });
});
});

app.get('/getAmtHistory', function(req, res) {
	MongoClient.connect(url, function(err, db) {
    db.collection("btnAmt").find({}).toArray( function(err, result) {
    if (err) throw err;
    db.close();
	return res.json(result);
  });
});
});

app.post('/setBtnAmt', function(req, res) {
	insertBtnAmtAtDate(req.body.date, req.body.value, res);
});

app.post('/delBtnAmt', function(req, res) {
	MongoClient.connect(url, function(err, db) {
	db.collection("btnAmt").remove({
        "date" : req.body.date
    }, function (err, doc) {
        if (err) {
            res.send("There was a problem deleting the information from the database.");
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

function checkDbUpdate(){
	
    var totalAmount = 0;	
	var obtainedPrices = 0;
	var totalCurrencies = 0;
	
	bittrex.getbalances(function (data) {		
	  totalCurrencies = data.result.length;
	  
	  data.result.forEach(function (tickerData) {
		  if (tickerData.Currency == "BTC") {	
			  totalAmount += tickerData.Balance;
			  obtainedPrices++;
		  }
		  else if (tickerData.Balance == 0){
			  obtainedPrices++;		  
		  }
		  else 
		  {
			  var url = "https://bittrex.com/api/v1.1/public/getticker?market=BTC-" + tickerData.Currency;
			  bittrex.sendCustomRequest(url, function (marketData) {
				  totalAmount += tickerData.Balance * marketData.result.Last;
				  obtainedPrices++;
				  
				  if(obtainedPrices == totalCurrencies)
					insertBtnAmtAtDate(new Date().toISOString(), totalAmount);
			  });
		  }
	  });	  
	});
		  
	setTimeout(function() {
	  checkDbUpdate();
	}, updateFrequency);
}

function insertBtnAmtAtDate(date, value, res){
	MongoClient.connect(url, function(err, db) {
	db.collection("btnAmt").insert({
        "date" : date,
        "value" : value
    }, function (err, doc) {
        if (err) {
            res.send("There was a problem adding the information to the database.");
        }
    });
	}); 
}

checkDbUpdate();
