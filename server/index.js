var http = require("http");
var express = require("express");
var ShareDB = require("sharedb");
var connect = require("connect");
var serveStatic = require('serve-static');
var WebSocketJSONStream = require('websocket-json-stream');
var WebSocket = require('ws');
var util = require('util');
var { convertToRaw, Editor, EditorState, RichUtils} = require('draft-js');
var jwt = require('jsonwebtoken');
var urlparse = require('url').parse;
var pry = require('pryjs')
// Conode BE Pages Repo

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

// Authentication Config
var jwtConf = {
  jwtOptions: {
    secret: '1234567',
  },
  exclusions: {
      path: []
  }
};


// Start ShareDB
var share = ShareDB({db: require('sharedb-mongo')('mongodb://localhost:27017/test-collab')} );
// var share = ShareDB();


// Create a WebSocket server
// This should be Express
var app = connect();
app.use(serveStatic('.'));
var server = http.createServer(app);

// Get all the pages in Conode MongoDB
// Protopy code for accessing Conode MongoDB
/*
app.use('/pages', function(req, res){
  var userId = req.query;
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("conode");
    dbo.collection("pages").find({}).toArray(function(err, result) {
      if (err) {
        res.end('Something is wrong');
        throw err;
      }
      res.end(JSON.stringify({result: result}));
      db.close();
    });
  });
});*/

// Using the verifyClient Server option in wws for Authentication. 
// The Authentication Token is passed through the query parameter 
var wss = new WebSocket.Server({server: server,
  verifyClient: function (info, cb) {
    try {
      var url_parts = urlparse(info.req.url, true);
      var query = url_parts.query;
      var token = query.token;

      if(!token)
          cb(false, 401, 'Unauthorized')
      else {
          jwt.verify(token, jwtConf.jwtOptions.secret, function (err, decoded) {
              if (err) {
                  cb(false, 401, 'Unauthorized')
              } else {
                  console.log(decoded);
                  cb(true)
              }
          })
      }
    } catch (err) {
        console.log(err);
        cb(false, 400, 'Something went wrong with websocket server!')
    }
}
});

server.listen(3338);
console.log("Listening on http://localhost:3338");

// Connect any incoming WebSocket connection with ShareDB
wss.on('connection', function(ws, req) {
  var stream = new WebSocketJSONStream(ws);
  share.listen(stream);
  /*
  eval(pry.it)
  ws.on('message', function(ws, req) {
    eval(pry.it)
  });*/
});

// Create initial documents
// var connection = share.connect();

share.use('query', (request, callback) => {
  console.log('QUERY');
  
  MongoClient.connect('mongodb://localhost:27017', function(err1, client1) {
      const db1 = client1.db('test-collab');
      const page1 = db1.collection('pages')
        .find({ _id: request.query._id})
        .toArray(function(err1, docs1) {
          if (docs1.length >= 1) {
            // Can I access, check permission??
            callback();
          } else {
            console.log('Get Page from Conode Database');
            MongoClient.connect('mongodb://localhost:27017', function(err2, client2) {
              const db2 = client2.db('conode'); 
              const page2 = db2.collection('pages')
                .find({ _id: request.query._id})
                .toArray(function(err2, docs2) {
                  docs2[0].richText = JSON.parse(docs2[0].richText);
                  share.connect().get('pages', request.query._id)
                    .create(docs2[0], (err) => {
                      callback();
                    });
                });
            });
          }
        });
    });
});

share.use('afterSubmit', (request, callback) => {
  // eval(pry.it)
  callback()
  // return console.log('AFTERSUBMIT');
  MongoClient.connect('mongodb://localhost:27017', function(err1, client1) {
      const db1 = client1.db('test-collab');
      const page1 = db1.collection('pages')
        .find({ _id: request.id})
        .toArray(function(err1, docs1) {
            console.log('Put Page in Conode Database');
            // console.log(JSON.stringify(docs1));
            // console.log(request.id);
            MongoClient.connect('mongodb://localhost:27017', function(err2, client2) {
              const db2 = client2.db('conode');
              const { collaborators, richText, plainText, tagIds, title, updatedAt, linkedItems, createdAt, ownerId } = docs1[0]
              const newPage = {
                plainText,
                tagIds,
                title,
                updatedAt,
                linkedItems,
                createdAt,
                ownerId,
                richText: JSON.stringify(richText),
                collaborators
              }
              // if collaborators is now empty, break down all connections!
              // determine new plainText
              const page2 = db2.collection('pages')
                .updateOne({ _id: request.id }, { $set: newPage})
                .catch((err) => console.log(JSON.stringify(err)));
            });
        });
    });
});

/*
connection.createFetchQuery('pages', {}, {}, function(err, results) {
  if (err) { throw err; }
  if (results.length > 0) console.log(JSON.stringify(results[0].data));
  if (results.length === 0) {

/* NOTE:
  In order to populate the sharedb-mongo with our existing pages, we
  should do something like: results.length === 0 
  var page = pageRetrivalWorkflow(pageId)....;
  doc.create(page);
*//*
    var ids = ["123", "456", "789"];

    ids.forEach(function(id) {
      var doc = connection.get('pages', id);
      var emptyPageData = convertToRaw(EditorState.createEmpty().getCurrentContent());
      doc.create(emptyPageData);
    });
  }
});
*/

/*  NOTE: it is still unclear to me how we should delete the oplog. The collection
    The collection starting with: o_"collection_name".
    A good starting point would be to take a look at the pubsub module. And delete 
    the page and oplogs in sharedb when the last subscriber unsubscribes. (Might be a pain)
*/




