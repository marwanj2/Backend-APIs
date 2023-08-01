require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const urlparser = require('url')
const dns = require('dns')

const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URL);
const db = client.db("urlshortner");
const urls = db.collection("urls")

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first api endpoint
app.post('/api/shorturl', (req,res) => {
  const url = req.body.url;
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
    if (!address) {
      res.json({ error: 'invalid url' })
    }else {
      const urlCount = await urls.countDocuments();
      const urlDoc = {
        url,
        short_url : urlCount
      }

      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({original_url: url, short_url:urlCount})
    }
  })

})


app.get('/api/shorturl/:shorturl', async (req,res) => {
  const shorturl = req.params.shorturl;
  const urlDoc = await urls.findOne({short_url: +shorturl});
  res.redirect(urlDoc.url)
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
