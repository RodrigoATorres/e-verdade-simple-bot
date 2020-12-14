const wa = require('@open-wa/wa-automate');
const hash = require('md5');
const mime = require('mime-types');
const path = require('path');
const fs = require('fs');
const shortid = require('shortid')
const urljoin = require('url-join');

const logger = require('../helpers/logger');

const Media = require('../models/media');
const ShortUrl = require('../models/shortUrl');
const Message = require('../models/message')

const gcController = require('./gcProcessing');

const {default: PQueue} = require('p-queue');
const saveImageQueue = new PQueue({concurrency: 1, timeout: 10000});

const wppClient = require('./wppClient');
const factCheckSearch = require('./factCheckSearch');

const getMediaLink = (md5, mimetype) =>{
    return `${process.env.MEDIA_FOLDER_URL}/${md5}.${mime.extension(mimetype)}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const saveImage = async( content, md5, mimetype ) =>{
    const eofBuf = Buffer.from([0xFF, 0xD9]);

    var filename = `${md5}.${mime.extension(mimetype)}`;
    fs.writeFile(path.join('Media',filename), Buffer.concat([content,eofBuf]), function(err) {
        if (err) {
          return logger.error(err);
        }
        logger.info(`File ${path.join('Media',filename)} saved!`);
    });
}


const getMd5 = async( message, downloadMedia = false, processMedia = false, isQueued = false) => {
    let doc = await  Media.findOne({fileHashes: message.filehash}).select('_id');
    if (doc){
        return doc._id;
    }
    else if (downloadMedia){
        if (!isQueued){
            return await saveImageQueue.add(async() => await getMd5( message, downloadMedia, processMedia, isQueued = true))
        } else{
            let content = await wa.decryptMedia(message);
            let md5 = hash(content);
            doc = await Media.findOne({_id:md5});
            if (doc){
                doc.fileHashes.push(message.filehash)
                doc.save()
            }
            else{
                let text = null, tags  = null;
                await saveImage(content, md5, message.mimetype);
                await sleep(200);
                if (processMedia){
                    [text, tags] = await gcController.getMediaInfo(md5, message.mimetype);
                }

                Media.create({
                    _id: md5,
                    fileHashes: [message.filehash],
                    mediaMime: message.mimetype,
                    mediaLink: getMediaLink(md5, message.mimetype),
                    mediaText:text,
                    mediaTags:tags,
                })
            }
            return md5;
        }
    }
}


const matchMessage = async(messageInfo) => {
    logger.info(`Started matching message ${messageInfo.text ? messageInfo.textMd5 : messageInfo.mediaMd5}`);

    let msgIds = [];
    let msgMatch = await Message.findOne({ textMd5s: messageInfo.textMd5, mediaMd5s: messageInfo.mediaMd5 }).select(['receivingInfo']);
    if (msgMatch){
        msgIds.push(msgMatch._id);
        msgMatch.receivingInfo.push({senderId: messageInfo.senderId, forwardingScore: messageInfo.forwardingScore});
        msgMatch.save()
    }
    else {
        msgMatch = await Message.create({
            texts: messageInfo.text ? [messageInfo.text]: null,
            textMd5s: messageInfo.text ? [messageInfo.textMd5]: null,
            textTags: messageInfo.text ? [await gcController.getTextTags(messageInfo.text)]: null,
            mediaMd5s: messageInfo.mediaMd5 ? [messageInfo.mediaMd5]: null,
            mediaExtensions: messageInfo.mediaExtension ? [messageInfo.mediaExtension] : null,
            receivingInfo: [{senderId: messageInfo.senderId, forwardingScore: messageInfo.forwardingScore}],
        });

    }
    logger.info(`Finished matching messages ${messageInfo.text ? messageInfo.textMd5 : messageInfo.mediaMd5}`);
    return msgMatch;
}

const addMessage = async (message) => {
    let downloadMedia = !message.isGroupMsg;
    let mediaMd5 = message.mimetype ? await getMd5(message, downloadMedia, downloadMedia) : null;
    let mediaExtension = message.mimetype ? mime.extension(message.mimetype) : null;
    let text = message.mimetype ? null : message.content;
    let textMd5 = message.mimetype ? null : hash(text);

    let msgDoc = await matchMessage({
        text,
        textMd5,
        mediaMd5,
        mediaExtension,
        forwardingScore: message.forwardingScore,
        senderId: message.sender.id,
    })

    wppClient.sendSeen(message.chatId);
    return msgDoc
}


exports.processMessage = async (message) =>{
    let msgDoc = await addMessage(message);

    for (let hoax of await factCheckSearch(message.content)){
        const urlCode = shortid.generate();
        const shortUrl = urljoin(process.env.MAIN_URL, urlCode)

        ShortUrl.create({
            urlCode,
            longUrl: hoax.url,
            senderId:message.sender.id,
            message:msgDoc
        }
        )

        wppClient.sendText(
            message.sender.id,
            `*${hoax.summary}*\n${shortUrl}`
        )
    }
}