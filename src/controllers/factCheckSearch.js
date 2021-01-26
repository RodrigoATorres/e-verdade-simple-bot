const dbObj = require("./dbConnection");

module.exports = async (msg) =>{
    res = await dbObj.connection.db.collection('articles').aggregate(
        [
          { $match: { $text: { $search: msg } } },
          { $sort: { score: { $meta: "textScore" } } },
          { $project: { summary: 1, url:1, _id: 0 , score: { $meta: "textScore" } } }
        ]
     ).limit(3).toArray()

    return res
}