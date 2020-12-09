const dbObj = require("./dbConnection");

module.exports = async (msg) =>{
    let res = await dbObj.collection('articles').find({$text: {$search: msg}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}}).limit(3).toArray()
    return res
}