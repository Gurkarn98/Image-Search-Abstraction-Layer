var express = require('express');
var app = express();
var https = require("https")
var mongodb = require("mongodb")
app.use(express.static('public'));

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});
app.get("/search/:term", function (req, res) {
  if (req.params.term == "client.js"){res.send("")}
  else{
    var term = req.params.term
    mongodb.connect(process.env.MONGODB, function (err, client){
      if (err) {console.log(err)}
      var db = client.db("fcc-database")
      var collection = db.collection("search-history")
      collection.find({}).toArray(function(err, data){
        console.log(data)
        if (data.length == 8) {
          collection.remove({_id: data[0]._id})
          collection.insert({term : term, when : new Date().toUTCString()})
          client.close()
        } else {
          collection.insert({term : term, when : new Date().toUTCString()})
          client.close()
        }
      })
    })
    var offset = Number(req.query.offset)
    if (isNaN(offset)){
      res.json({ERROR: "Enter a valid number for Offset.",
               HELP: "Visit https://imgsrch-al.glitch.me/ for more information"})
    } else if (offset == 0){
      offset = 1;
    } else {}
    var url = "https://www.googleapis.com/customsearch/v1?q="+term+"&cx=001479493839567702616%3Autohuztu9tm&imgSize=large&searchType=image&start="+offset+"&key="+process.env.KEY
    https.get(url, function(response) {
      var results = ""
      response.setEncoding("utf8");
      response.on('data', function (data) {
        results += data;
      });
      response.on('end', () => {
        results = JSON.parse(results)
        if (results.hasOwnProperty("error")){
          res.json({ERROR: "Try Again tommorow!!!"})
        } else {
        results = results.items
          results.forEach(function (a){
            delete a.kind
            delete a.title
            delete a.htmlTitle
            delete a.displayLink
            delete a.htmlSnippet
            delete a.mime
            a.thumbnail = a.image.thumbnailLink
            a.context = a.image.contextLink
            delete a.image
            res.send(results)
          })
        }
      });
    });
  }
});
app.get("/latest-search", function (req, res) {
  if (req.params.term == "client.js"){res.send("")}
  else{
    mongodb.connect(process.env.MONGODB, function (err, client){
      if (err) {console.log(err)}
      var db = client.db("fcc-database")
      var collection = db.collection("search-history")
      collection.find({}).toArray(function(err, data){
        res.json(data.reverse())
        client.close()
      })
    })
  }
})
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
