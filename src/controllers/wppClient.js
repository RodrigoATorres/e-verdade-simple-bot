const wa = require('@open-wa/wa-automate');
const deasync = require('deasync');

let client;
let isReady = false;

wa.create({sessionDataPath: 'SessionData', disableSpins:true})
.then(async tmpClient => {
    client = tmpClient;
    isReady = true;
})

deasync.loopWhile(function(){return !isReady;});
module.exports = client