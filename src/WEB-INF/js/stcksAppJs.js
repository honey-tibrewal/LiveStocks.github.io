var stocksApp = angular.module('stocksApp',[]);


//Directive for Spark line
stocksApp.directive('priceSpark', [function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elem, attrs, ngModel) {

             var opts={};
            opts.type = attrs.type || 'line';
            opts.width = '180px';

            scope.$watch(attrs.ngModel, function (value) {
                render();
            },true);
            
            scope.$watch(attrs.opts, function(){
              render();
            });
            
            var render = function () {
                var model;
                if(attrs.opts) angular.extend(opts, angular.fromJson(attrs.opts));
                console.log(opts);
                // Trim trailing comma if we are a string
                angular.isString(ngModel.$viewValue) ? model = ngModel.$viewValue.replace(/(^,)|(,$)/g, "") : model = ngModel.$viewValue;
                var data;
                // Make sure we have an array of numbers
                angular.isArray(model) ? data = model : data = model.split(',');
                $(elem).sparkline(data, opts);
            };
        }
    }
}]);

//an array to get the three letter month name from its corresponding month number
var months = {0:"Jan",1:"Feb",2:"Mar",3:"Apr",4:"May",5:"Jun",6:"Jul",7:"Aug",8:"Sep",9:"Oct",10:"Nov",11:"Dec"};

//A controller to connect to the socket and recieve/update data in the array used in binding with html 
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
	
	//Update angular array of objects on receiving updates from socket
	$scope.updateTableData = function(message){
		$.each(message,function(i,entry){
			var found = false;
			for (var index = 0; index < $scope.tableData.length;index++) {
				 var object = $scope.tableData[index];

				 if(entry.ticker == object.ticker){
				   found = true;
				   //setting colour as green when the received price is lower than the previous one
				   if(entry.price < object.price){
					   object.priceClass = 'red';
				   }else if(entry.price > object.price){ //setting colour as red when new price is greater than old
					   object.priceClass = 'green';
				   }
				   object.price = entry.price;
				   object.sparkArr.push(object.price);
				   object.lastUpdate = getDate();
				   object.currentUpdate = true;
				   break;
				 }else{
					 object.currentUpdate = false; 
				 }
				}
			//if the value received is a new value
			if(found == false){
				entry.sparkArr.push(entry.price);
				$scope.tableData.push(entry);
			}
		});
	}
	
});

//Method to format array data received into a json Object
function formatIntoJson(data){
	var arr = [];
	data.forEach(function(entry){
		console.log('name' + entry[0] +'price' + entry[1]);
		var obj = {'ticker':entry[0],'price':getFormattedPrice(entry[1]),'lastUpdate':getDate(),'priceClass':'white','currentUpdate':false,'sparkArr':[]};
		arr.push(obj);
	});
	
	return arr;
}

//Utility method to round of the value received to 3 decimals
function getFormattedPrice(val){
	
	return Math.round(val*1000)/1000;
	
}

//Utility method to get the javascript date into dd MMM hh:mm Format
function getDate(){
	var formattedDate;
	var date = new Date();
	formattedDate = date.getDate() + " " + months[date.getMonth()] +" "+getTimeInAmPm(date);
	return formattedDate;
}

//Setting am and pm for time format
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

//Utility method to add 0 to single digit minute values
function getFormattedMinutes(val){
	var returnVal;
	if(val < 10){
		returnVal = '0'+val;
	}else{
		returnVal = val;
	}
	return returnVal;
}
 
//Closing the socket connection when the user closes the browser
window.onbeforeunload = function(){
	var e = e||window.event;
	if(e){
		socket.close();
	}
}