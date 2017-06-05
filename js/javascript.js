
function onLoadClick(){	
	var loadBtn = $('#loadBtn');
	loadBtn.prop('disabled', true);
	loadBtn.attr('value', 'Loading ...');
	
	createCurrencyTable();
}

function createCurrencyTable(currenciesData){
	
  var totalDiv = $('#totalDiv');
  totalDiv.html('');
  getBalances(fillCurrenciesTable);
}

function fillCurrenciesTable(currenciesData){

  var loadTime = $('#lastUpd');
  var totalAmtField = $('#totalAmt');
  var currenciesObj = JSON.parse(currenciesData);

  delete currenciesObj.currenciesQuantity;
  delete currenciesObj.obtainedPrices;
  
  var totalAmount = 0;
  
  Object.keys(currenciesObj).forEach(function(key) {
    if(typeof currenciesObj[key].BtcValue == 'number') 
		totalAmount += currenciesObj[key].BtcValue;
  });
  
  var currenciesArray = [];
  for (var key in currenciesObj ) {
	if (currenciesObj.hasOwnProperty(key)) {
		currenciesArray[currenciesArray.length] = currenciesObj[key];
	}
  }
  currenciesArray.unshift({"Title1":"Currency","Title2":"Balance","Title3":"Available","Title4":"Pending","Title5":"CryptoAddr","Title6":"Btn value"});
  
  var currencyTable = $('#currenciesTable');
  currencyTable.html('');
  $.jsontotable(currenciesArray, { id: "#currenciesTable" , header: true});  
  loadTime.html(new Date());  
 
  totalAmtField.html(totalAmount);
  
  var loadBtn = $('#loadBtn');
  loadBtn.prop('disabled', false);
  loadBtn.attr('value', 'Load');  
  onLoadClick();
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


			