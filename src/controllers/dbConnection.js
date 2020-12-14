require('dotenv').config()

const deasync = require('deasync');
const mongoose = require('mongoose')
const MONGO_URL = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.DB_ADDRES}/${process.env.DB_NAME}?authSource=admin`;
console.log(MONGO_URL)

let isDbReady = false
let dbObj

mongoose
.connect(
    MONGO_URL
)
.then( async(db) =>{
    dbObj = db
    const result = await dbObj.connection.db.collection('articles').createIndex({ 'hoax': 'text' });
    isDbReady = true
});


deasync.loopWhile( () => !isDbReady );

module.exports = dbObj