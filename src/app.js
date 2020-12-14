require('dotenv').config()
require('./index')
const messages = require('./controllers/messages')
const wppClient = require('./controllers/wppClient')

wppClient.onMessage(async message => {
    if (message.isGroupMsg){
    return      
    }
    messages.processMessage(message)
}
)
