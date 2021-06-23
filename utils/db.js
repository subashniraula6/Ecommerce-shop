const MongoClient = require('mongodb').MongoClient;

let _db;

// Connecting and storing connection to _db therefore this will keep on running
const mongoConnect = callback => {
    MongoClient.connect("mongodb+srv://subash123:subash123@cluster0.hzeps.mongodb.net/shop?retryWrites=true&w=majority")
        .then(client => {
            console.log('connected!')
            _db = client.db();
            callback()
        })
        .catch(error => console.log(error))
}

// getting access to that connected database 
const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'no database found!'
}
exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
