var express = require('express'),
    router = express.Router(),
    AddressProvider = require('../addressprovider-mongodb').AddressProvider,
    addressProvider = new AddressProvider('localhost', 27017);


function createArray(obj){
    var array = [];
    obj.forEach(function(store, id){
        array.push( [store.Name, store.Latitude, store.Longitude, id, store.Address] );
    });
    return array;
}


/* GET home page. */
router.get('/', function(req, res) {
  //res.render('index', { title: {name: 'Express' }});

    addressProvider.findAll( function(error, addresses){
        console.log( JSON.stringify(addresses[0]) );

        res.render('index', {

                title:    'Maps',
                addresses: addresses,
                obj: JSON.stringify(createArray(addresses))
        });
    })

});


router.get('/localtion/:id', function(req, res) {
    addressProvider.findById(req.params.id, function(error, address) {
        res.render('location',
            { locals: {
                name:    address.Name,
                address: address.Address,
                article: address
            }
            });
    });
});

module.exports = router;
