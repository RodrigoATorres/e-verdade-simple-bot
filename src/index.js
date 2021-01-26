const express = require("express");
var geoip = require('geoip-lite');

const shortUrl = require('./models/shortUrl')

const app = express();

app.use(express.json({}));
const PORT = 80;
app.listen(PORT, () => console.log("Server is listening on port " + PORT));


app.get('/', async (req, res) => {

    if (!req.query.s){
        return res.redirect('https://www.everdade.com.br');
    }
    else{
        let url = new URL('https://google.com/search')
        url.searchParams.set('q', req.query.s + ' site:boatos.org OR site:aosfatos.org OR site:checamos.afp.com OR site:www.correiobraziliense.com.br/holofote OR site:e-farsas.com OR site:www.etechecagem.com OR site:g1.globo.com/fato-ou-fake OR site:noticias.uol.com.br/confere OR site:piaui.folha.uol.com.br/lupa OR site:politica.estadao.com.br/blogs/estadao-verifica OR site:projetocomprova.com.br' )
        res.redirect(url.href)
    }

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
