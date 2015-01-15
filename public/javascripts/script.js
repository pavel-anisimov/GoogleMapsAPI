function initialize(grid, num){

	var myGrid, myLatlng, mapOptions, map, mapObj = $('#map_canvas')[0];

	myGrid = {x: grid.lat, y:grid.lng};
	myLatlng = new google.maps.LatLng(myGrid.x, myGrid.y);

	mapOptions = {
		center: myLatlng,
		zoom: 11,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(mapObj, mapOptions);


	var marker = [];

	function setMarkers(map, locations) {
		for (var i = 0; i < locations.length; i++) {
			var store = locations[i],
				myLatLng = new google.maps.LatLng(store[1], store[2]);

			marker[i] = new google.maps.Marker({
				position: myLatLng,
				map: map,
				title: store[0],
				zIndex: store[3],
				animation: google.maps.Animation.DROP
			});
		}
	}

	function buildInfo(name, address, grid, dist) {
		return '<div id="content">'+
			'<div id="siteNotice">'+
			'<div class="storeName">' + name + '</div>' +
			'<div class="storeAddress">' + address + '</div>' +
			'<div>Direct distance to my location is ' + dist
			+ ' miles.</div>' +
			'<div><a class="direction" href="#" data-address="' + address +'" data-lat="' + grid.x +'" data-lng="' + grid.y + '">Driving direction</a></div>'
		'</div></div>';
	}


	var storeLocations, gMarker;
	var posting = $.post('./api', {call: 'arr', lat: grid.lat, lng: grid.lng, num: num });

	posting.success(function(res, req){
		storeLocations = res;

		setMarkers(map, storeLocations);

		var infowindow = [];
		storeLocations.forEach(function(store, i){
			infowindow[i] = new google.maps.InfoWindow({
				content: buildInfo(store[0], store[4], {x: store[1], y: store[2]}, store[5].toFixed(1))
			});

			google.maps.event.addListener(marker[i], 'click', function() {
				infowindow[i].open(map, marker[i]);
			});
		});
	}).error().always(function(){

		gMarker = '';

	});

	return {gMap: map, Marker: placeSingleMarker(map, grid, true)};
}


function placeSingleMarker(map, grid, home){
	var myLatLng, mapOptions, marker;

	myLatLng = new google.maps.LatLng(grid.lat, grid.lng);

	mapOptions = {
		position: myLatLng,
		map: map,
		title: 'Home',
		animation: google.maps.Animation.DROP
	}

	if(!!home)
		mapOptions.icon = 'images/hm2.png';

	marker = new google.maps.Marker(mapOptions);
	marker.setMap(map);

	return marker;
}


function calcRoute(directions, start, end) {
	if (start === undefined)
		start = 'Concord, CA';
	if (end === undefined)
		end = 'San Francisco, CA';

	var request = {
		origin:start,
		destination:end,
		travelMode: google.maps.TravelMode.DRIVING
	};
	directions.Services.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directions.Display.setDirections(response);
		}
	});
}


function moveMarker(map, marker, grid){
	marker.setPosition( new google.maps.LatLng(grid.lat, grid.lng) );
	map.panTo( new google.maps.LatLng(grid.lat, grid.lng ) );
}

$(function(){
	var $map = $('#map_canvas'), res, myGrid, myAddress,
		directionsDisplay = new google.maps.DirectionsRenderer(),
		directionsService = new google.maps.DirectionsService();


	function calcPageHeight(){
		var winHeight = $( window ).height(),
			docHeight = $( document ).height(),
			$block    = $('#block'),
			$footer   = $('#footer'),
			$refIcons = $('.referenceIcons'),
			$refTitle = $('.referenceTitle'),
			margin    = 90,
			newHeight;

		if (winHeight === docHeight) {
			newHeight = winHeight - $refIcons.height() - $refTitle.height() - $footer.height() - margin;
			$block.css('min-height', newHeight+'px');
		}
	}

	function loadTheMap(grid, num) {

		if($map.hasClass('hidden')) {
			$map.removeClass('hidden');
			res = initialize(grid, num);
			this.gMap = res.gMap;
			this.Marker = res.Marker;
			directionsDisplay.setMap(this.gMap);
		}
		else {
			this.gMap.setCenter(new google.maps.LatLng(grid.lat, grid.lng));
			moveMarker(this.gMap, this.Marker, grid);
		}
	}

	function isNormalInteger(str) {
		var n = ~~Number(str);
		return String(n) === str && n >= 0;
	}

	$('#refresh').on('click', function(){
		window.location.href = '/';
	});

	$('#print').on('click', function(){
		window.print();
	});

	$('#submit').on('click', function(){
		var $address = $('#your_address'),
			$number = $('#number'),
			number = $number.val(),
			address = myAddress = $address.val(),
			$form = $('#form'),
			$display = $('#display'),
			url, msg = '';

		if(number === '' || number.toLowerCase().trim() === 'all') {
			number = 'all';
		} else if(isNormalInteger(number)) {
			$number.removeClass('error');
			number = +number;
		} else {
			$number.addClass('error');
		}

		if(address.trim() === '') {
			$address.addClass('error');
		} else {
			url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&region=USA';
			$address.removeClass('error');
		}

		if(!$('#form > input').hasClass('error')) {

			if(number === 'all')
				msg += 'Displaying all stores around ' + address;
			else if (number === 1)
				msg += 'Displaying the closest store to ' + address;
			else
				msg += 'Displaying ' + number + ' closest stores to ' + address;

			$.get(url).success(function(res, req){
				myGrid = res.results[0].geometry.location;

				if(res.status === 'OK') {
					$form.removeClass('margin');
					loadTheMap(myGrid, number);
				}
				else
					$form.addClass('margin');

				$form.addClass('hidden');
				$display.children('#result').text( msg );
				$display.removeClass('hidden');

			}).error(function(e){
				console.log(e);
			});
		}
	});


	/*
	$('#your_address').on('change', function(){

	}); */

	function JsonToUrl(obj) {
		var params = [];
		for(key in obj)
			if(key !== 'url')
				params.push(key + '=' + obj[key]);

		return obj.url + '?' + params.join('&');
	}

	$('#directions > .label').on('click', function(){
		$('#directions >.direction').toggle();
	});

	$map.delegate('.direction', 'click', function(){
		var posting, $direction = $('#directions > .direction');
			$this = $(this),
			url = {
				url: 'https://maps.googleapis.com/maps/api/directions/json',
				origin: myAddress,
				destination: $this.data('address')
			};

		posting = $.post('api/direction', {url: JsonToUrl(url)});

		posting.done().success(function(res, req){

			$('#directions').removeClass('hidden');
			if(!$direction.is(":visible"))
				$direction.show();

			$direction.html(res.html);

			calcRoute({Display: directionsDisplay,
				Services: directionsService } , url.origin, url.destination);

		}).error(function(e){
			console.log(e);
		}).always();
	});

	calcPageHeight();

});



