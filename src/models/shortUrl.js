const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const urlSchema = new Schema({
    urlCode: String,
    longUrl: String,
    clickCount: {
        type: Number,
        default: 0
    },
    clickInfo: [{}],
    senderId:String,
    message:{
        type:Schema.Types.ObjectId,
        ref:'Message',
    },
}
);

module.exports = mongoose.model("ShortUrl", urlSchema);