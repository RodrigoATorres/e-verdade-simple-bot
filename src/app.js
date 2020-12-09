const wppClient = require('./controllers/wppClient')
const factCheckSearch = require('./controllers/factCheckSearch')

wppClient.onMessage(async message => {
    if (message.isGroupMsg){
    return      
    }

    for (let hoax of await factCheckSearch(message.content)){
        console.log(hoax)
        wppClient.sendText(
            message.sender.id,
            `*${hoax.summary}*\n${hoax.url}`
        )
    }
}
)
