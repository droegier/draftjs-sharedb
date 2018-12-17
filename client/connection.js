var sharedb = require('sharedb/lib/client');
var ReconnectingWebSocket = require('reconnecting-websocket');
// Expose a singleton WebSocket connection to ShareDB server
// Authentication by query parameter
// TODO: use secure web socket wss:// for encrypted
// NOTE: WebSocket does not do auto reconnect
// used https://github.com/pladaria/reconnecting-websocket
//var socket = new WebSocket('ws://' + window.location.host +'?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImR1bW15X2lkIiwiaWF0IjoxNTMzMDExNDM5fQ.sJU3LnBqG-AQW-fNqBq-2g07vyICp527AmudcNWJT8c');
var socket = new ReconnectingWebSocket('ws://' + window.location.host +'?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImR1bW15X2lkIiwiaWF0IjoxNTMzMDExNDM5fQ.sJU3LnBqG-AQW-fNqBq-2g07vyICp527AmudcNWJT8c');
var connection = new sharedb.Connection(socket);
module.exports = connection;

// wscat --connect ws://localhost:3338?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImR1bW15X2lkIiwiaWF0IjoxNTMzMDExNDM5fQ.sJU3LnBqG-AQW-fNqBq-2g07vyICp527AmudcNWJT8c