const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    texts:[{
        type: String,
    }],

    textMd5s:[{
        type: String,
    }],

    textTags:[
        [{
            name:String,
            tagType:String,
            salience:Number
        }]
    ],

    mediaMd5s:[{
        type: String,
        ref: 'Media' 
    }],

    mediaExtensions:[{
        type: String
    }],

    receivingInfo: [{
        senderId:String,
        forwardingScore:Number,
        timeStamp:{type : Date, default: Date.now }
    }],
},
{
timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
}
)

module.exports = mongoose.model('Message', messageSchema);