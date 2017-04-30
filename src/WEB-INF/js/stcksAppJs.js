var stocksApp = angular.module('stocksApp',[]);

var months = {0:"Jan",1:"Feb",2:"Mar",3:"Apr",4:"May",5:"Jun",6:"Jul",7:"Aug",8:"Sep",9:"Oct",10:"Nov",11:"Dec"};
stocksApp.controller('mainController',function($scope){
	
	$scope.tableData = [];
	$scope.orderByField = 'ticker';
	  $scope.reverseSort = false;

	//Connect to the socket
	socket = new WebSocket('ws://stocks.mnet.website');
	
	// Show a connected message when the WebSocket is opened.
	socket.onopen = function(event) {
	  console.log('Socket Connection Opened!!')
	};
	
	// Handle any errors that occur.
	socket.onerror = function(error) {
	  console.log('WebSocket Error: ' + error);
	};
	
	// Handle messages sent by the server.
	socket.onmessage = function(event) {
		var dataReceived ;
		$scope.$apply(function(){
			var message = event.data;
			dataReceived = formatIntoJson(JSON.parse(message));
			$scope.updateTableData(dataReceived);
			console.log('Data Update Received'+updateMessage);
		});
	  
	};
	
	$scope.updateTableData = function(message){
		$.each(message,function(i,entry){
			var found = false;
			for (var index = 0; index < $scope.tableData.length;index++) {
				 var object = $scope.tableData[index];

				 if(entry.ticker == object.ticker){
				   found = true;
				   if(entry.price < object.price){
					   object.priceClass = 'red';
				   }else if(entry.price > object.price){
					   object.priceClass = 'green';
				   }
				   object.price = entry.price;
				   object.lastUpdate = getDate();
				   object.currentUpdate = true;
				   break;
				 }else{
					 object.currentUpdate = false; 
				 }
				}
			if(found == false){
				$scope.tableData.push(entry);
			}
		});
	}
	
});

function formatIntoJson(data){
	var arr = [];
	data.forEach(function(entry){
		console.log('name' + entry[0] +'price' + entry[1]);
		var obj = {'ticker':entry[0],'price':getFormattedPrice(entry[1]),'lastUpdate':getDate(),'priceClass':'white','currentUpdate':false};
		arr.push(obj);
	});
	
	return arr;
}

function getFormattedPrice(val){
	
	return Math.round(val*1000)/1000;
	
}

function getDate(){
	var formattedDate;
	var date = new Date();
	formattedDate = date.getDate() + " " + months[date.getMonth()] +" "+getTimeInAmPm(date);
	return formattedDate;
}

function getTimeInAmPm(val){
	var reurnVal;
	if(val.getHours() > 12){
		returnVal = val.getHours() - 12;
		returnVal = returnVal + ":"+ getFormattedMinutes(val.getMinutes())+ ' pm';
	}else{
		returnVal = val.getHours()  + ":"+ getFormattedMinutes(val.getMinutes()) + ' am';
	}
	return returnVal;
}

function getFormattedMinutes(val){
	var returnVal;
	if(val < 10){
		returnVal = '0'+val;
	}else{
		returnVal = val;
	}
	return returnVal;
}
 
window.onbeforeunload = function(){
	var e = e||window.event;
	if(e){
		socket.close();
	}
}