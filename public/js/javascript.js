
function onLoadData(){		
	getBalances(fillCurrenciesTable);
}

function fillCurrenciesTable(currenciesData){
	
  var currenciesObj = JSON.parse(currenciesData);
  
  var totalBtcAmount = 0;
  var totalDollarAmount = 0;
  
  var BtcDollarValue = currenciesObj["USDT"].DollarAmt;
    
  Object.keys(currenciesObj).forEach(function(key) {
    if(typeof currenciesObj[key].BtcValue == 'number') 
		totalBtcAmount += currenciesObj[key].BtcValue;	
	if(key == "USDT"){
		currenciesObj[key].BtcValue = currenciesObj[key].Balance;
	}
	else 
		currenciesObj[key].DollarAmt = currenciesObj[key].BtcValue * BtcDollarValue;
	
	if(typeof currenciesObj[key].DollarAmt == 'number'){
		if(key == "USDT")
			totalDollarAmount += currenciesObj[key].Balance;
		else 
			totalDollarAmount += currenciesObj[key].DollarAmt;
	}
  });
  
  var currenciesArray = [];
  for (var key in currenciesObj ) {
	if (currenciesObj.hasOwnProperty(key)) {
		currenciesArray[currenciesArray.length] = currenciesObj[key];
	}
  }
  
  currenciesArray.unshift({"Title1":"Currency","Title2":"Balance","Title3":"Available","Title4":"Btn value","Title5":"Dollar value"});
  currenciesArray = currenciesArray.sort(function(a,b){return b['BtcValue'] > a['BtcValue']});
  
  var currencyTable = $('#currenciesTable');
  currencyTable.html('');
  $.jsontotable(currenciesArray, { id: "#currenciesTable" , header: true});  
  
  $('#lastUpd').html(new Date()); 
  $('#totalBtcAmt').html(totalBtcAmount);
  
  $('#totalDollarAmt').html(totalDollarAmount);
  
  getHistory(prepareDataAndDrawChart);
  $("#currenciesTable").prependTo("#totalDiv");  
}

function getBalances(callback){
   xmlhttp = new XMLHttpRequest();
   xmlhttp.open("GET","/getbalances", true);
   xmlhttp.onreadystatechange=function(){
         if (xmlhttp.readyState==4 && xmlhttp.status==200){
           callback(xmlhttp.responseText);
         }
   }
   xmlhttp.send();
}

function getHistory(callback){
   xmlhttp = new XMLHttpRequest();
   xmlhttp.open("GET","/getAmtHistory", true);
   xmlhttp.onreadystatechange=function(){
         if (xmlhttp.readyState==4 && xmlhttp.status==200){
           callback(xmlhttp.responseText);
         }
   }
   xmlhttp.send();
}

function setBalance(date, value){
	xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", "/setBtnAmt", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("date="+date.toISOString()+"&value="+value);
}

function delBalance(date){
	xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", "/delBtnAmt", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("date="+date);
}

function prepareDataAndDrawChart(data){	
	var dates = [];
	var values = [];
	Array.from(JSON.parse(data)).forEach(function(item){
		dates.push(item.date);
		values.push(item.value);
	});
	
	drawAmountChart(dates,values);
}

function drawAmountChart(xData,yData){
	Plotly.plot( document.getElementById('amtChart'), [{
		x: xData,
		y: yData,
		name: 'Btn Amount'}], { 
		margin: { t: 0 } } );
}


			
			
			