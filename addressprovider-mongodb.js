var MongoDB = require('mongodb'),
	Db = MongoDB.Db,
	Connection = MongoDB.Connection,
	Server = MongoDB.Server,
	BSON = MongoDB.BSON,
	ObjectID = MongoDB.ObjectID;

AddressProvider = function(host, port) {
	this.db= new Db('maps_api', new Server(host, port, {auto_reconnect: true}, {}));
	this.db.open(function(){});
};


AddressProvider.prototype.getAddresses = function(callback) {
	this.db.collection('addresses', function(error, addresses) {
		if( error ) callback(error);
		else callback(null, addresses);
	});
};

AddressProvider.prototype.findAll = function(callback) {
	this.getAddresses(function(error, addresses_collection) {
		if( error ) callback(error)
		else {
			addresses_collection.find().toArray(function(error, results) {
				if( error ) callback(error)
				else callback(null, results)
			});
		}
	});
};


AddressProvider.prototype.findById = function(id, callback) {
	this.getAddresses(function(error, addresses_collection) {
		if( error ) callback(error)
		else {
			addresses_collection.findOne({_id: addresses_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
				if( error ) callback(error)
				else callback(null, result)
			});
		}
	});
};


exports.AddressProvider = AddressProvider;