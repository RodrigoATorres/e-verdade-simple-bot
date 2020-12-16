const express = require("express");
var geoip = require('geoip-lite');

const shortUrl = require('./models/shortUrl')

const app = express();

app.use(express.json({}));
const PORT = 80;
app.listen(PORT, () => console.log("Server is listening on port " + PORT));


app.get('/', async (req, res) => {
    return res.redirect('https://www.everdade.com.br');
})

app.get('/:shortUrlCode', async (req, res) => {
    var shortUrlCode = req.params.shortUrlCode;
    var url = await shortUrl.findOne({ urlCode: shortUrlCode });
    try {
        if (url) {
            var clickCount = url.clickCount;
            clickCount++;
            let geo = geoip.lookup(req.connection.remoteAddress)
            url.clickInfo.push({geo, headers: req.headers, ip:req.connection.remoteAddress})
            await url.save()
            await url.update({ clickCount });
            return res.redirect(url.longUrl);
        } else {
            return res.status(400).json("The short url doesn't exists in our system.");
        }
    }
    catch (err) {
        console.error("Error while retrieving long url for shorturlcode " + shortUrlCode);
        return res.status(500).json("There is some internal error.");
    }
})
