var express = require('express'),
	router = express.Router(),
	request = require('request'),
	AddressProvider = require('../addressprovider-mongodb').AddressProvider,
	addressProvider = new AddressProvider('localhost', 27017);

if (typeof Number.prototype.toRadians == 'undefined') {
	Number.prototype.toRadians = function() { return this * Math.PI / 180; };
}

function calcDist(o){
	var R, f1, f2, df, dl, a, c;

	R = 3958.756; // miles
	f1 = o.lat1.toRadians();
	f2 = o.lat2.toRadians();
	df = (o.lat2 - o.lat1).toRadians();
	dl = (o.lon2 - o.lon1).toRadians();

	a = Math.sin(df/2) * Math.sin(df/2) +
	Math.cos(f1) * Math.cos(f2) *
	Math.sin(dl/2) * Math.sin(dl/2);
	c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return R * c;
}

function createArray(obj, myGrid, num){

	var array = [], dist = {lat1: +myGrid.lat, lon1: +myGrid.lng };

	obj.forEach(function(store, id){

		dist['lat2'] = +store.Latitude;
		dist['lon2'] = +store.Longitude;

		array.push( [store.Name, store.Latitude, store.Longitude, id, store.Address, calcDist(dist)] );
	});

	array.sort(function(a,b) {
		return a[5] - b[5];
	});

	if (num !== 'all')
		array = array.slice(0, +num);

	array.forEach(function(val, id){
		val[3] = id;
	});

	return array;
}



router.post('/', function (req, res) {

	var body = req.body, arr, myGrid;

	myGrid = {lat: body.lat, lng: body.lng};

	addressProvider.findAll( function(error, addresses){

		if(body.call === 'obj')
			arr = { title: 'Maps', addresses: addresses };
		else if (body.call === 'arr')
			arr = createArray(addresses, myGrid, body.num);
		else
			arr = { error: 'error' };

		res.json(arr);
	});
});

router.post('/direction', function (req, res) {
	var data, rout, html = '';

	request(req.body.url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			data = JSON.parse(body);

			if(data.status === 'OK') {

				rout = data.routes[0];

				html += '<div class="total">' +
					'<div class="via">via ' + rout.summary + '</div>' +
					'<div class="time">' + rout.legs[0].duration.text + '</div>' +
					'<div class="distance">' + rout.legs[0].distance.text + '</div>' +
				'</div>';

				html += '<div class="start"> '+ rout.legs[0].start_address + '</div>';

				html += '<div class="rout">';

				rout.legs[0].steps.forEach(function(val){

					html += '<div class="sub">' + val.html_instructions +
						'<div class="distance">' +
							'<span>' + val.distance.text + '</span> ● ' +
							'<span>' + val.duration.text + '</span>' +
						'</div>' +
					'</div>';
				});

				html += '</div>';

				html += '<div class="end"> '+ rout.legs[0].end_address + '</div>';

				res.json({status: 'OK', html: html});
			}
		}
	});
});

module.exports = router;



